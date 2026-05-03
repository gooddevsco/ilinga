/**
 * Conflict reducer.
 *
 * When two modules write the same content key in the same cycle the reducer
 * deterministically picks a winner and records every candidate so a human
 * can review later. Strategy: prefer the highest-confidence candidate;
 * break ties by the most recent createdAt.
 */

export interface ReducerCandidate {
  source: string;
  value: unknown;
  confidence: number;
  createdAt: Date | string;
}

export interface ReducerVerdict {
  chosen: ReducerCandidate;
  rationale: string;
  alternates: ReducerCandidate[];
}

export const reduce = (candidates: ReducerCandidate[]): ReducerVerdict => {
  if (candidates.length === 0) throw new Error('reduce called with no candidates');
  const sorted = [...candidates].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    const at =
      a.createdAt instanceof Date ? a.createdAt.getTime() : Date.parse(String(a.createdAt));
    const bt =
      b.createdAt instanceof Date ? b.createdAt.getTime() : Date.parse(String(b.createdAt));
    return bt - at;
  });
  const chosen = sorted[0]!;
  const alternates = sorted.slice(1);
  const rationale =
    alternates.length === 0
      ? 'single candidate'
      : `chose '${chosen.source}' (conf ${chosen.confidence}) over ${alternates.length} other(s)`;
  return { chosen, rationale, alternates };
};
