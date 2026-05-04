import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Eyebrow, Icons, ProgressBar, Tag, cn } from '@ilinga/ui';
import { api } from '../../lib/api';
import { useTenant } from '../../lib/tenant';

interface VentureRow {
  id: string;
  name: string;
  industry: string | null;
  geos: string[];
  brief: Record<string, unknown> | null;
  createdAt?: string;
}

interface CycleRow {
  id: string;
  seq: number;
  status: string;
}

const KPI = ({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent?: boolean;
}): JSX.Element => (
  <Card className="p-4">
    <Eyebrow>{label}</Eyebrow>
    <div
      className="mono mt-2 text-[32px]"
      style={{
        color: accent ? 'var(--signal)' : 'var(--ink)',
        lineHeight: 1.05,
        fontWeight: 500,
      }}
    >
      {value}
    </div>
    <div className="mono mt-1 text-[11px] text-[color:var(--ink-faint)]">{sub}</div>
  </Card>
);

const seedClusters = [
  { code: 'positioning', label: 'Positioning', done: 0, total: 6 },
  { code: 'market', label: 'Market & TAM', done: 0, total: 8 },
  { code: 'competition', label: 'Competition', done: 0, total: 7 },
  { code: 'gtm', label: 'Go-to-Market', done: 0, total: 9 },
  { code: 'product', label: 'Product Strategy', done: 0, total: 7 },
  { code: 'unit-econ', label: 'Unit Economics', done: 0, total: 6 },
  { code: 'risk', label: 'Risk & Compliance', done: 0, total: 5 },
  { code: 'team', label: 'Team & Capital', done: 0, total: 6 },
];

const FirstRunHero = ({ tenantName }: { tenantName: string }): JSX.Element => (
  <Card className="r-2col grid gap-7 p-7" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
    <div>
      <Eyebrow>Welcome</Eyebrow>
      <h1
        className="serif mt-3 text-[38px] tracking-tight"
        style={{ fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.02em' }}
      >
        {tenantName} is live.
      </h1>
      <p
        className="mt-3 text-[14px] text-[color:var(--ink-mute)]"
        style={{ maxWidth: 560, lineHeight: 1.6 }}
      >
        Drop a brief and a few competitor links — the agent interviews you across 8 clusters, fans
        out into modules, and writes a source-ready report. Your free credits are loaded.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/ventures/new">
          <Button variant="primary" size="lg" type="button">
            Brief your first venture <Icons.arrow />
          </Button>
        </Link>
        <Link to="/help">
          <Button variant="ghost" size="lg" type="button">
            See it working
          </Button>
        </Link>
      </div>
    </div>
    <div>
      <Eyebrow>Cluster preview</Eyebrow>
      <div className="mt-3 flex flex-col">
        {seedClusters.map((c, i) => (
          <div
            key={c.code}
            className="flex items-center justify-between border-b border-dashed py-2 text-[12px]"
            style={{
              borderColor: 'var(--line)',
              color: 'var(--ink-mute)',
              borderBottomWidth: i === seedClusters.length - 1 ? 0 : undefined,
            }}
          >
            <span>{c.label}</span>
            <span className="mono text-[11px] text-[color:var(--ink-faint)]">0/{c.total}</span>
          </div>
        ))}
      </div>
    </div>
  </Card>
);

const ActiveVentureHero = ({
  venture,
  cycle,
  clusters,
}: {
  venture: VentureRow;
  cycle: CycleRow | null;
  clusters: { label: string; done: number; total: number }[];
}): JSX.Element => {
  const overall = useMemo(() => {
    const total = clusters.reduce((a, c) => a + c.total, 0);
    const done = clusters.reduce((a, c) => a + c.done, 0);
    return total ? Math.round((done / total) * 100) : 0;
  }, [clusters]);
  const interviewHref = cycle
    ? `/ventures/${venture.id}/cycles/${cycle.id}/interview`
    : `/ventures/${venture.id}`;
  return (
    <Card className="r-2col grid gap-7 p-7" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
      <div>
        <Eyebrow>Active venture</Eyebrow>
        <h1
          className="serif mt-3 text-[38px] tracking-tight"
          style={{ fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.02em' }}
        >
          {venture.name}
        </h1>
        <div className="mono mt-2 text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
          {[venture.industry, ...(venture.geos ?? [])].filter(Boolean).join(' · ') ||
            'Industry · Geography'}
          {cycle ? ` · CYCLE ${String(cycle.seq).padStart(2, '0')}` : ''}
        </div>
        <p
          className="mt-3 text-[14px] text-[color:var(--ink-mute)]"
          style={{ maxWidth: 560, lineHeight: 1.6 }}
        >
          {(venture.brief as { thesis?: string } | null)?.thesis ??
            'No thesis yet. Update the brief to seed the agent with context.'}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to={interviewHref}>
            <Button variant="primary" type="button">
              Resume interview <Icons.arrow />
            </Button>
          </Link>
          <Link to={`/ventures/${venture.id}`}>
            <Button variant="secondary" type="button">
              Review venture
            </Button>
          </Link>
          <Link to="/reports">
            <Button variant="ghost" type="button">
              Reports
            </Button>
          </Link>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Eyebrow>Cycle progress</Eyebrow>
          <span className="mono text-[26px]" style={{ fontWeight: 500 }}>
            {overall}%
          </span>
        </div>
        <ProgressBar value={overall} ariaLabel="Cycle progress" />
        <div
          className="mt-4 grid gap-x-6 gap-y-2 text-[12px]"
          style={{ gridTemplateColumns: '1fr 1fr' }}
        >
          {clusters.map((c) => {
            const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
            return (
              <div
                key={c.label}
                className="flex items-center justify-between border-b border-dashed py-1"
                style={{ borderColor: 'var(--line)' }}
              >
                <span className="text-[color:var(--ink-mute)]">{c.label}</span>
                <span
                  className={cn('mono text-[11px]')}
                  style={{ color: pct === 100 ? 'var(--signal)' : 'var(--ink-faint)' }}
                >
                  {c.done}/{c.total}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export const Dashboard = (): JSX.Element => {
  const { current } = useTenant();
  const [ventures, setVentures] = useState<VentureRow[] | null>(null);
  const [cycle, setCycle] = useState<CycleRow | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!current) return;
    api
      .get<{ ventures: VentureRow[] }>(`/v1/ventures/tenant/${current.id}`)
      .then((r) => setVentures(r.ventures))
      .catch(() => setVentures([]));
    api
      .get<{ balance: number }>(`/v1/billing/tenant/${current.id}/balance`)
      .then((r) => setBalance(r.balance))
      .catch(() => setBalance(null));
  }, [current]);

  useEffect(() => {
    if (!current || !ventures || ventures.length === 0) {
      setCycle(null);
      return;
    }
    const v = ventures[0]!;
    api
      .get<{ cycles: CycleRow[] }>(`/v1/ventures/tenant/${current.id}/${v.id}/cycles`)
      .then((r) => setCycle(r.cycles[0] ?? null))
      .catch(() => setCycle(null));
  }, [current, ventures]);

  if (!current) {
    return <p className="text-[13px] text-[color:var(--ink-mute)]">No workspace selected.</p>;
  }

  const isLoading = ventures === null;
  const hasVenture = ventures && ventures.length > 0;
  const venture = hasVenture ? ventures[0]! : null;

  return (
    <div className="flex flex-col gap-6">
      {isLoading ? (
        <Card className="flex items-center gap-2 p-7 text-[13px] text-[color:var(--ink-mute)]">
          <span className="spinner" /> Loading workspace…
        </Card>
      ) : venture ? (
        <ActiveVentureHero venture={venture} cycle={cycle} clusters={seedClusters} />
      ) : (
        <FirstRunHero tenantName={current.displayName} />
      )}

      <section className="r-cards-4 grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KPI
          label="Credits remaining"
          value={balance ?? '—'}
          sub={balance == null ? 'LOADING…' : `OF 500 · TOPS UP ANYTIME`}
          accent
        />
        <KPI
          label="Ventures"
          value={ventures ? ventures.length : '—'}
          sub="ACTIVE THIS WORKSPACE"
        />
        <KPI label="Modules generated" value={0} sub="ACROSS ALL CYCLES" />
        <KPI label="Reports rendered" value={0} sub="THIS BILLING PERIOD" />
      </section>

      <section className="r-2col grid gap-4" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <Card>
          <div className="flex items-center justify-between border-b border-[color:var(--line)] px-5 py-3.5">
            <span className="text-[14px]" style={{ fontWeight: 500 }}>
              Ventures
            </span>
            <span className="mono text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
              {ventures ? `${ventures.length} ACTIVE` : '—'}
            </span>
          </div>
          {ventures && ventures.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[13px] text-[color:var(--ink-mute)]">
                No ventures yet — brief your first to start the loop.
              </p>
              <Link to="/ventures/new" className="mt-3 inline-flex">
                <Button variant="primary" size="sm" type="button">
                  Brief a venture
                </Button>
              </Link>
            </div>
          ) : (
            <table className="cmp">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Venture</th>
                  <th>Industry</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(ventures ?? []).map((v, i) => (
                  <tr key={v.id}>
                    <td className="mono text-[color:var(--ink-faint)]">
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      <Link to={`/ventures/${v.id}`} className="hover:underline">
                        {v.name}
                      </Link>
                    </td>
                    <td className="text-[color:var(--ink-mute)]">{v.industry ?? '—'}</td>
                    <td className="text-right">
                      <Tag tone="signal">{v.geos.length || 0} GEOS</Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <div
            className="border-b border-[color:var(--line)] px-5 py-3.5 text-[14px]"
            style={{ fontWeight: 500 }}
          >
            Activity
          </div>
          <div className="flex flex-col p-3">
            {ventures && ventures.length === 0 ? (
              <p className="px-2 py-3 text-[13px] text-[color:var(--ink-mute)]">
                Activity from you and the agent will show up here.
              </p>
            ) : (
              <p className="px-2 py-3 text-[13px] text-[color:var(--ink-mute)]">
                Recent activity will appear once interviews and reports start running.
              </p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
};
