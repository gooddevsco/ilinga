import { createHash } from 'node:crypto';

/**
 * Canonical-JSON + sha-256 hash chain for the audit log (§36).
 * Serialises an object with sorted keys so identical content always yields
 * the same hash on different runs / clusters.
 */
const canonicalize = (value: unknown): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']';
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return (
      '{' +
      keys
        .filter((k) => obj[k] !== undefined)
        .map((k) => JSON.stringify(k) + ':' + canonicalize(obj[k]))
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(value);
};

export interface AuditRowLike {
  tenantId: string | null;
  actorUserId: string | null;
  impersonatorUserId: string | null;
  action: string;
  targetTable: string | null;
  targetId: string | null;
  payload: unknown;
  createdAt: Date | string;
}

export const computeRowHash = (row: AuditRowLike, prevHash: Buffer | null): Buffer => {
  // Project to the canonical field set so callers can pass enriched rows
  // (with prevHash + rowHash already attached) without polluting the hash.
  const projection: AuditRowLike = {
    tenantId: row.tenantId ?? null,
    actorUserId: row.actorUserId ?? null,
    impersonatorUserId: row.impersonatorUserId ?? null,
    action: row.action,
    targetTable: row.targetTable ?? null,
    targetId: row.targetId ?? null,
    payload: row.payload,
    createdAt: row.createdAt,
  };
  const h = createHash('sha256');
  if (prevHash) h.update(prevHash);
  h.update(canonicalize(projection));
  return h.digest();
};

export const verifyChainSegment = (
  rows: ReadonlyArray<AuditRowLike & { rowHash: Buffer; prevHash: Buffer | null }>,
): { ok: true } | { ok: false; brokenAt: number } => {
  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i]!;
    const expectedPrev = i === 0 ? r.prevHash : rows[i - 1]!.rowHash;
    if (r.prevHash && expectedPrev && !expectedPrev.equals(r.prevHash)) {
      return { ok: false, brokenAt: i };
    }
    const recomputed = computeRowHash(r, r.prevHash);
    if (!recomputed.equals(r.rowHash)) {
      return { ok: false, brokenAt: i };
    }
  }
  return { ok: true };
};
