import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Eyebrow, Icons, Skeleton, Tag, cn, useToast } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';
import { formatDateTZ } from '../../lib/format';

interface Venture {
  id: string;
  name: string;
  industry: string | null;
  geos: string[];
  brief: { thesis?: string; wedge?: string; scope?: string };
  createdAt: string;
}

interface Cycle {
  id: string;
  seq: number;
  status: string;
}

const cycleTone = (status: string): 'signal' | 'green' | 'neutral' => {
  if (status === 'open' || status === 'active') return 'signal';
  if (status === 'locked' || status === 'closed') return 'green';
  return 'neutral';
};

export const VentureDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const { current } = useTenant();
  const [venture, setVenture] = useState<Venture | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (!current || !id) return;
    Promise.all([
      api.get<{ venture: Venture }>(`/v1/ventures/tenant/${current.id}/${id}`),
      api.get<{ cycles: Cycle[] }>(`/v1/ventures/tenant/${current.id}/${id}/cycles`),
    ])
      .then(([v, c]) => {
        setVenture(v.venture);
        setCycles(c.cycles);
      })
      .catch((e: ApiError) => setError(`Status ${e.status}`));
  }, [current, id]);

  const openCycle = cycles.find((c) => c.status === 'open') ?? cycles[0];

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-[color:var(--danger)]">{error}</p>
        <Link to="/ventures" className="text-[13px] underline">
          Back to ventures
        </Link>
      </div>
    );
  }
  if (!venture) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton width={240} height={28} />
        <Skeleton height={140} />
        <Skeleton height={120} />
      </div>
    );
  }

  const saveBrief = async (): Promise<void> => {
    if (!current) return;
    try {
      const next = { ...venture.brief, thesis: draft };
      await api.patch(`/v1/ventures/tenant/${current.id}/${venture.id}/brief`, {
        brief: next,
      });
      toast.push({ variant: 'success', title: 'Brief updated' });
      setVenture({ ...venture, brief: next });
      setEditing(false);
    } catch {
      toast.push({ variant: 'error', title: 'Could not update brief' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/ventures"
            className="mono text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)] hover:text-[color:var(--ink)]"
          >
            ← Ventures
          </Link>
          <h1
            className="serif mt-1 text-[32px] tracking-tight"
            style={{ fontWeight: 500, letterSpacing: '-0.02em' }}
          >
            {venture.name}
          </h1>
          <div className="mono mt-1 flex flex-wrap items-center gap-2.5 text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
            <span>{venture.industry ?? 'INDUSTRY TBD'}</span>
            <span>·</span>
            <span>
              {venture.geos.length === 0
                ? 'NO GEOS'
                : venture.geos.map((g) => g.toUpperCase()).join(' · ')}
            </span>
            <span>·</span>
            <span>CREATED {formatDateTZ(venture.createdAt, 'UTC')}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {openCycle ? (
            <>
              <Link to={`/ventures/${venture.id}/cycles/${openCycle.id}/interview`}>
                <Button variant="primary" type="button">
                  Open interview <Icons.arrow />
                </Button>
              </Link>
              <Link to={`/ventures/${venture.id}/cycles/${openCycle.id}/synthesis`}>
                <Button variant="secondary" type="button">
                  Synthesis
                </Button>
              </Link>
              <Link to={`/ventures/${venture.id}/cycles/${openCycle.id}/reports`}>
                <Button variant="ghost" type="button">
                  Reports
                </Button>
              </Link>
            </>
          ) : (
            <Tag>NO OPEN CYCLE</Tag>
          )}
        </div>
      </header>

      <Card className="r-2col grid gap-7 p-6" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div>
          <Eyebrow>Brief {editing ? '· editing' : '· locked'}</Eyebrow>
          {editing ? (
            <textarea
              className="textarea mt-3"
              rows={6}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
          ) : (
            <p
              className="mt-3 text-[14px] text-[color:var(--ink)]"
              style={{ lineHeight: 1.6, maxWidth: 640 }}
            >
              {venture.brief.thesis ?? '— no thesis recorded yet —'}
            </p>
          )}
          {venture.brief.wedge && !editing && (
            <p className="mt-3 text-[13px] text-[color:var(--ink-mute)]" style={{ maxWidth: 640 }}>
              <span className="mono mr-2 text-[11px] uppercase text-[color:var(--ink-faint)]">
                WEDGE
              </span>
              {venture.brief.wedge}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            {editing ? (
              <>
                <Button variant="primary" size="sm" type="button" onClick={saveBrief}>
                  Save brief
                </Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => {
                  setDraft(venture.brief.thesis ?? '');
                  setEditing(true);
                }}
              >
                Edit thesis
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Eyebrow>Tags</Eyebrow>
          <div className="flex flex-wrap gap-1.5">
            {venture.industry && <Tag>{venture.industry}</Tag>}
            {venture.brief.scope && <Tag tone="indigo">{venture.brief.scope.toUpperCase()}</Tag>}
            {venture.geos.map((g) => (
              <Tag key={g} tone="signal">
                {g.toUpperCase()}
              </Tag>
            ))}
            {venture.geos.length === 0 && !venture.industry && !venture.brief.scope && <Tag>—</Tag>}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between border-b border-[color:var(--line)] px-5 py-3.5">
          <span className="text-[14px]" style={{ fontWeight: 500 }}>
            Cycles
          </span>
          <Eyebrow>{cycles.length} CYCLES</Eyebrow>
        </div>
        {cycles.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-[color:var(--ink-mute)]">
            No cycles yet. Brief the venture and the first cycle opens automatically.
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--line)]">
            {cycles.map((cy) => (
              <li
                key={cy.id}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 px-5 py-3.5',
                  cy.status !== 'open' && 'opacity-90',
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="mono text-[12px] text-[color:var(--ink-faint)]">
                    CYCLE V{cy.seq}
                  </span>
                  <Tag tone={cycleTone(cy.status)} dot>
                    {cy.status.toUpperCase()}
                  </Tag>
                </div>
                <div className="flex flex-wrap gap-2 text-[12px]">
                  <Link
                    to={`/ventures/${venture.id}/cycles/${cy.id}/interview`}
                    className="hover:text-[color:var(--signal)]"
                  >
                    Interview
                  </Link>
                  <span className="text-[color:var(--ink-faint)]">·</span>
                  <Link
                    to={`/ventures/${venture.id}/cycles/${cy.id}/synthesis`}
                    className="hover:text-[color:var(--signal)]"
                  >
                    Synthesis
                  </Link>
                  <span className="text-[color:var(--ink-faint)]">·</span>
                  <Link
                    to={`/ventures/${venture.id}/cycles/${cy.id}/keys`}
                    className="hover:text-[color:var(--signal)]"
                  >
                    Keys
                  </Link>
                  <span className="text-[color:var(--ink-faint)]">·</span>
                  <Link
                    to={`/ventures/${venture.id}/cycles/${cy.id}/reports`}
                    className="hover:text-[color:var(--signal)]"
                  >
                    Reports
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-[color:var(--line)] px-5 py-3.5">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            disabled={!openCycle}
            onClick={async () => {
              if (!openCycle || !current) return;
              try {
                const r = await api.post<{ id: string; seq: number }>(
                  `/v1/ventures/tenant/${current.id}/cycles/clone`,
                  { cycleId: openCycle.id },
                );
                toast.push({ variant: 'success', title: `Cloned to v${r.seq}` });
                setCycles((prev) => [...prev, { id: r.id, seq: r.seq, status: 'open' }]);
              } catch {
                toast.push({ variant: 'error', title: 'Could not clone cycle' });
              }
            }}
          >
            <Icons.cycle /> Clone open cycle
          </Button>
        </div>
      </Card>
    </div>
  );
};
