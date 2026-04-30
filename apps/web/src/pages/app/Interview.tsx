import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Field, Skeleton, Textarea, useToast } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';
import { Comments } from '../../features/comments/Comments';

interface Question {
  id: string;
  code: string;
  cluster: string;
  label: string;
  helpText: string | null;
  inputType: 'text' | 'number';
  sequence: number;
}

interface AnswerRow {
  id: string;
  questionId: string;
  rawValue: unknown;
  version: number;
}

const useFetchOnce = <T,>(path: string | null): { data: T | null; error: string | null } => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    setData(null);
    setError(null);
    api
      .get<T>(path)
      .then(setData)
      .catch((e: ApiError) => setError(`Status ${e.status}`));
  }, [path]);
  return { data, error };
};

export const Interview = (): JSX.Element => {
  const { vid, cid } = useParams<{ vid: string; cid: string }>();
  const { current } = useTenant();
  const toast = useToast();
  const { data: questionsData } = useFetchOnce<{ questions: Question[] }>(
    current && cid ? `/v1/cycles/${cid}/questions` : null,
  );
  // The questions endpoint isn't strictly required to exist; if not, fall back to client-side.
  const questions = useMemo<Question[]>(() => {
    if (questionsData?.questions) return questionsData.questions;
    return [
      {
        id: 'P1.1',
        code: 'P1.1',
        cluster: 'Problem',
        label: 'Who has this problem most acutely?',
        helpText: null,
        inputType: 'text',
        sequence: 100,
      },
      {
        id: 'P1.2',
        code: 'P1.2',
        cluster: 'Problem',
        label: 'What do they currently do about it?',
        helpText: null,
        inputType: 'text',
        sequence: 110,
      },
      {
        id: 'S1.1',
        code: 'S1.1',
        cluster: 'Solution',
        label: 'What is your wedge?',
        helpText: null,
        inputType: 'text',
        sequence: 200,
      },
      {
        id: 'M1.1',
        code: 'M1.1',
        cluster: 'Market',
        label: 'How big is the market today, in dollars?',
        helpText: null,
        inputType: 'number',
        sequence: 300,
      },
      {
        id: 'G1.1',
        code: 'G1.1',
        cluster: 'GTM',
        label: 'What is your first acquisition channel?',
        helpText: null,
        inputType: 'text',
        sequence: 400,
      },
      {
        id: 'R1.1',
        code: 'R1.1',
        cluster: 'Risk',
        label: 'Single biggest risk that could kill the business?',
        helpText: null,
        inputType: 'text',
        sequence: 500,
      },
    ];
  }, [questionsData]);

  const [answers, setAnswers] = useState<
    Record<
      string,
      {
        value: string;
        version: number | null;
        saving: boolean;
        conflict?: { current: string };
        answerId?: string;
      }
    >
  >({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

  // Load existing answers
  useEffect(() => {
    if (!current || !cid) return;
    api
      .get<{ answers: AnswerRow[] }>(`/v1/cycles/${cid}/answers`)
      .then((r) => {
        const next: Record<
          string,
          { value: string; version: number | null; saving: boolean; answerId?: string }
        > = {};
        for (const a of r.answers) {
          next[a.questionId] = {
            value: typeof a.rawValue === 'string' ? a.rawValue : JSON.stringify(a.rawValue ?? ''),
            version: a.version,
            saving: false,
            answerId: a.id,
          };
        }
        setAnswers((prev) => ({ ...next, ...prev }));
      })
      .catch(() => undefined);
  }, [current, cid]);

  const save = async (q: Question, value: string): Promise<void> => {
    if (!current) return;
    const ans = answers[q.id];
    setAnswers((prev) => ({
      ...prev,
      [q.id]: { ...(prev[q.id] ?? { version: null }), value, saving: true, conflict: undefined },
    }));
    try {
      const headers: Record<string, string> = {};
      if (ans?.version !== null && ans?.version !== undefined)
        headers['If-Match'] = String(ans.version);
      const res = await fetch(
        `${import.meta.env['VITE_API_ORIGIN'] ?? 'http://localhost:3001'}/v1/cycles/${cid}/answers`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Il-Tenant-Id': current.id,
            'X-Il-Csrf': decodeURIComponent(
              document.cookie
                .split('; ')
                .find((c) => c.startsWith('il_csrf='))
                ?.split('=')[1] ?? '',
            ),
            ...headers,
          },
          body: JSON.stringify({ questionId: q.id, rawValue: value }),
        },
      );
      if (res.status === 412) {
        const body = (await res.json()) as { currentVersion: number; currentValue: unknown };
        setAnswers((prev) => ({
          ...prev,
          [q.id]: {
            value,
            version: body.currentVersion,
            saving: false,
            conflict: {
              current:
                typeof body.currentValue === 'string'
                  ? body.currentValue
                  : JSON.stringify(body.currentValue),
            },
          },
        }));
        toast.push({
          variant: 'warning',
          title: 'This answer changed elsewhere',
          body: 'Resolve the conflict and re-save.',
        });
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { id: string; version: number };
      setAnswers((prev) => ({
        ...prev,
        [q.id]: { value, version: body.version, saving: false, answerId: body.id },
      }));
    } catch {
      setAnswers((prev) => ({
        ...prev,
        [q.id]: { ...(prev[q.id] ?? { version: null }), value, saving: false },
      }));
      toast.push({ variant: 'error', title: 'Save failed', body: 'Will retry on next change.' });
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Question[]>();
    for (const q of [...questions].sort((a, b) => a.sequence - b.sequence)) {
      const arr = map.get(q.cluster) ?? [];
      arr.push(q);
      map.set(q.cluster, arr);
    }
    return Array.from(map.entries());
  }, [questions]);

  if (!current || !vid || !cid) {
    return <Skeleton height={120} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to={`/ventures/${vid}`} className="text-xs text-[color:var(--color-fg-muted)]">
            ← Venture
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Interview</h1>
        </div>
        <Link
          to={`/ventures/${vid}/synthesis?cycle=${cid}`}
          className="inline-flex h-9 items-center rounded-md bg-[color:var(--color-accent)] px-4 text-sm text-[color:var(--color-accent-fg)]"
        >
          Run synthesis
        </Link>
      </header>
      {grouped.map(([cluster, qs]) => (
        <section key={cluster} className="space-y-3">
          <h2 className="text-xs uppercase tracking-wide text-[color:var(--color-fg-subtle)]">
            {cluster}
          </h2>
          {qs.map((q) => {
            const a = answers[q.id];
            return (
              <div key={q.id} className="rounded-lg border border-[color:var(--color-border)] p-4">
                <Field label={q.label} htmlFor={q.id} hint={q.helpText ?? undefined}>
                  <Textarea
                    id={q.id}
                    rows={3}
                    spellCheck={q.inputType === 'text'}
                    defaultValue={a?.value ?? ''}
                    onBlur={(e) => save(q, e.currentTarget.value)}
                  />
                </Field>
                <div className="mt-2 flex items-center gap-3 text-xs text-[color:var(--color-fg-muted)]">
                  {a?.saving && <span aria-live="polite">Saving…</span>}
                  {!a?.saving && a?.version !== null && a?.version !== undefined && (
                    <span>Saved (v{a.version})</span>
                  )}
                  {a?.answerId && (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenComments((prev) => ({
                          ...prev,
                          [q.id]: !prev[q.id],
                        }))
                      }
                      className="ml-auto underline"
                    >
                      {openComments[q.id] ? 'Hide comments' : 'Comments'}
                    </button>
                  )}
                  {a?.conflict && (
                    <span className="text-[color:var(--color-warning)]">
                      Conflict: server has &quot;{a.conflict.current}&quot;.
                      <Button
                        size="sm"
                        variant="secondary"
                        className="ml-2"
                        onClick={() => save(q, a.conflict!.current)}
                      >
                        Use server
                      </Button>
                    </span>
                  )}
                </div>
                {openComments[q.id] && a?.answerId && (
                  <div className="mt-3 border-t border-[color:var(--color-border)] pt-3">
                    <Comments target="question_answers" targetId={a.answerId} cycleId={cid} />
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
};
