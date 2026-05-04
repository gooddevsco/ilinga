import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Eyebrow,
  Icons,
  Kbd,
  ProgressBar,
  Skeleton,
  Tag,
  Textarea,
  cn,
  useToast,
} from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';
import { Comments } from '../../features/comments/Comments';
import { PresenceDots } from '../../features/synthesis/PresenceDots';
import { usePresenceBeacon } from '../../lib/streaming/usePresenceBeacon';

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

const fallbackQuestions: Question[] = [
  {
    id: 'P1.1',
    code: 'P1.1',
    cluster: 'Problem',
    label: 'Who has this problem most acutely?',
    helpText: 'Identify the segment that suffers the worst version of the pain.',
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
    helpText: 'The smallest valuable thing you can ship.',
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

interface AnswerState {
  value: string;
  version: number | null;
  saving: boolean;
  conflict?: { current: string };
  answerId?: string;
}

export const Interview = (): JSX.Element => {
  const { vid, cid } = useParams<{ vid: string; cid: string }>();
  const { current } = useTenant();
  const toast = useToast();
  const { data: questionsData } = useFetchOnce<{ questions: Question[] }>(
    current && cid ? `/v1/cycles/${cid}/questions` : null,
  );

  const questions = useMemo<Question[]>(() => {
    if (questionsData?.questions && questionsData.questions.length > 0) {
      return [...questionsData.questions].sort((a, b) => a.sequence - b.sequence);
    }
    return fallbackQuestions;
  }, [questionsData]);

  const clusters = useMemo(() => {
    const map = new Map<string, Question[]>();
    for (const q of questions) {
      const arr = map.get(q.cluster) ?? [];
      arr.push(q);
      map.set(q.cluster, arr);
    }
    return Array.from(map.entries()).map(([id, qs], i) => ({
      id,
      label: id,
      qs,
      num: String(i + 1).padStart(2, '0'),
    }));
  }, [questions]);

  const [activeCluster, setActiveCluster] = useState<string | null>(clusters[0]?.id ?? null);
  useEffect(() => {
    if (!activeCluster && clusters[0]) setActiveCluster(clusters[0].id);
  }, [clusters, activeCluster]);

  const activeIdx = clusters.findIndex((c) => c.id === activeCluster);
  const active = activeIdx >= 0 ? clusters[activeIdx] : clusters[0];

  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

  // Load existing answers
  useEffect(() => {
    if (!current || !cid) return;
    api
      .get<{ answers: AnswerRow[] }>(`/v1/cycles/${cid}/answers`)
      .then((r) => {
        const next: Record<string, AnswerState> = {};
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
      [q.id]: {
        ...(prev[q.id] ?? { value: '', version: null, saving: false }),
        value,
        saving: true,
        conflict: undefined,
      },
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
        const body = (await res.json()) as {
          currentVersion: number;
          currentValue: unknown;
        };
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
        [q.id]: {
          ...(prev[q.id] ?? { value: '', version: null, saving: false }),
          value,
          saving: false,
        },
      }));
      toast.push({
        variant: 'error',
        title: 'Save failed',
        body: 'Will retry on next change.',
      });
    }
  };

  // Always-on hook — beacon happily no-ops if cid is undefined.
  usePresenceBeacon(cid, 'interview');

  if (!current || !vid || !cid) {
    return <Skeleton height={120} />;
  }

  const totalQs = clusters.reduce((a, c) => a + c.qs.length, 0);
  const doneQs = Object.values(answers).filter((a) => (a?.value ?? '').trim() !== '').length;
  const overall = totalQs ? Math.round((doneQs / totalQs) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to={`/ventures/${vid}`}
            className="mono text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)] hover:text-[color:var(--ink)]"
          >
            ← Venture
          </Link>
          <h1
            className="serif mt-1 text-[28px] tracking-tight"
            style={{ fontWeight: 500, letterSpacing: '-0.02em' }}
          >
            Interview
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PresenceDots cycleId={cid} />
          <Link to={`/ventures/${vid}/cycles/${cid}/synthesis`}>
            <Button variant="primary" type="button">
              Run synthesis <Icons.arrow />
            </Button>
          </Link>
        </div>
      </header>

      <div
        className="r-interview-grid grid gap-4"
        style={{ gridTemplateColumns: '320px 1fr 360px' }}
      >
        {/* LEFT — progress map */}
        <aside
          className="r-side-rail flex flex-col gap-4 rounded-md border border-[color:var(--line)] bg-[color:var(--bg-1)] p-4"
          style={{ alignSelf: 'start' }}
        >
          <div>
            <Eyebrow>Progress map</Eyebrow>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="mono"
                style={{ fontSize: 32, letterSpacing: '-0.02em', fontWeight: 500 }}
              >
                {overall}
                <span style={{ fontSize: 14, color: 'var(--ink-faint)' }}>%</span>
              </span>
              <span className="mono text-[11px] text-[color:var(--ink-faint)]">
                {doneQs}/{totalQs} ANSWERED
              </span>
            </div>
            <ProgressBar value={overall} ariaLabel="Overall progress" className="mt-2" />
          </div>

          <div className="flex flex-col gap-1">
            {clusters.map((c) => {
              const done = c.qs.filter((q) => {
                const v = answers[q.id]?.value ?? '';
                return v.trim() !== '';
              }).length;
              const p = c.qs.length ? Math.round((done / c.qs.length) * 100) : 0;
              const isActive = c.id === activeCluster;
              const isDone = p === 100;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCluster(c.id)}
                  className={cn('cluster-row', isActive && 'active', isDone && 'done')}
                  style={{ ['--p' as never]: p } as React.CSSProperties}
                >
                  <span className="num">{c.num}</span>
                  <span className="ring" style={{ ['--p' as never]: p } as React.CSSProperties} />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-[13px]" style={{ fontWeight: isActive ? 500 : 400 }}>
                      {c.label}
                    </div>
                    <div className="mono mt-0.5 text-[10px] uppercase text-[color:var(--ink-faint)]">
                      {c.qs.length} QUESTIONS
                    </div>
                  </div>
                  <span
                    className="mono text-[11px]"
                    style={{
                      color: isDone ? 'var(--signal)' : 'var(--ink-faint)',
                    }}
                  >
                    {done}/{c.qs.length}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CENTER — questions in active cluster */}
        <main className="flex flex-col gap-5">
          {active && (
            <>
              <div className="flex items-center gap-2.5">
                <Tag tone="signal" dot>
                  {active.num} · {active.label.toUpperCase()}
                </Tag>
                <span className="mono text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
                  {active.qs.length} QUESTIONS
                </span>
              </div>
              <h2
                className="serif text-[28px] tracking-tight"
                style={{ fontWeight: 500, letterSpacing: '-0.02em' }}
              >
                {active.label}
              </h2>
              <div className="flex flex-col gap-3">
                {active.qs.map((q) => {
                  const a = answers[q.id];
                  return (
                    <Card key={q.id} className="fade-up p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <Tag>{q.code}</Tag>
                        <span className="text-[15px]" style={{ fontWeight: 500 }}>
                          {q.label}
                        </span>
                      </div>
                      {q.helpText && (
                        <p className="mb-3 text-[13px] text-[color:var(--ink-mute)]">
                          {q.helpText}
                        </p>
                      )}
                      <Textarea
                        id={q.id}
                        rows={3}
                        spellCheck={q.inputType === 'text'}
                        defaultValue={a?.value ?? ''}
                        onBlur={(e) => save(q, e.currentTarget.value)}
                        placeholder="Type your answer here…"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-[color:var(--ink-mute)]">
                        {a?.saving && (
                          <span className="flex items-center gap-1.5" aria-live="polite">
                            <span className="spinner" /> Saving…
                          </span>
                        )}
                        {!a?.saving && a?.version != null && (
                          <span className="mono text-[11px] text-[color:var(--ink-faint)]">
                            SAVED · V{a.version}
                          </span>
                        )}
                        {a?.answerId && (
                          <button
                            type="button"
                            className="ml-auto underline hover:text-[color:var(--ink)]"
                            onClick={() =>
                              setOpenComments((prev) => ({
                                ...prev,
                                [q.id]: !prev[q.id],
                              }))
                            }
                          >
                            {openComments[q.id] ? 'Hide comments' : 'Comments'}
                          </button>
                        )}
                        {a?.conflict && (
                          <div className="flex items-center gap-2 text-[color:var(--warn)]">
                            <Tag tone="ochre" dot>
                              Conflict
                            </Tag>
                            <span>Server has &ldquo;{a.conflict.current}&rdquo;.</span>
                            <Button
                              size="sm"
                              variant="secondary"
                              type="button"
                              onClick={() => save(q, a.conflict!.current)}
                            >
                              Use server
                            </Button>
                          </div>
                        )}
                      </div>
                      {openComments[q.id] && a?.answerId && (
                        <div className="mt-3 border-t border-[color:var(--line)] pt-3">
                          <Comments target="question_answers" targetId={a.answerId} cycleId={cid} />
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    if (activeIdx > 0) setActiveCluster(clusters[activeIdx - 1]!.id);
                  }}
                  disabled={activeIdx <= 0}
                >
                  <Icons.arrowLeft /> Previous cluster
                </Button>
                <span className="flex-1" />
                <Kbd>⌘ ↵</Kbd>
                <Button
                  variant="primary"
                  type="button"
                  onClick={() => {
                    if (activeIdx < clusters.length - 1) {
                      setActiveCluster(clusters[activeIdx + 1]!.id);
                    } else {
                      toast.push({
                        variant: 'success',
                        title: 'Cluster complete',
                        body: 'Run synthesis when you’re ready to fan out modules.',
                      });
                    }
                  }}
                >
                  {activeIdx === clusters.length - 1 ? 'Finish cluster' : 'Next cluster'}{' '}
                  <Icons.arrow />
                </Button>
              </div>
            </>
          )}
        </main>

        {/* RIGHT — agent panel */}
        <aside
          className="r-interview-rail flex flex-col gap-4 rounded-md border border-[color:var(--line)] bg-[color:var(--bg-1)] p-4"
          style={{ alignSelf: 'start' }}
        >
          <div className="flex items-center gap-2">
            <span
              className="pulse rounded-full"
              style={{ width: 8, height: 8, background: 'var(--signal)' }}
            />
            <Eyebrow style={{ color: 'var(--signal)' }}>Agent · listening</Eyebrow>
          </div>
          <p className="text-[13px] text-[color:var(--ink)]" style={{ lineHeight: 1.55 }}>
            As you fill answers, the agent flags follow-ups and pre-fills the prompt graph used by
            your reports. Keys turn into final report bodies on render.
          </p>
          <div
            className="rounded-md border border-dashed border-[color:var(--line-2)] p-3.5"
            style={{ borderStyle: 'dashed' }}
          >
            <Eyebrow>Queued follow-ups · 0</Eyebrow>
            <p className="mt-2 text-[13px] text-[color:var(--ink-mute)]">
              The agent surfaces clarifying questions here as it reads your draft.
            </p>
          </div>

          <div className="my-2 h-px bg-[color:var(--line)]" />
          <Eyebrow>Estimated cost if rendered now</Eyebrow>
          <div className="flex flex-col">
            {[
              { n: 'Snapshot', c: 0 },
              { n: 'Competitive Landscape', c: 35 },
              { n: 'GTM Playbook', c: 60 },
            ].map((r, i, arr) => (
              <div
                key={r.n}
                className="flex items-center justify-between border-b border-dashed py-1.5 text-[12px]"
                style={{
                  borderColor: 'var(--line)',
                  borderBottomWidth: i === arr.length - 1 ? 0 : undefined,
                }}
              >
                <span>{r.n}</span>
                <span
                  className="mono"
                  style={{
                    color: r.c === 0 ? 'var(--signal)' : 'var(--ink)',
                  }}
                >
                  {r.c === 0 ? 'INCLUDED' : `${r.c} CR`}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
