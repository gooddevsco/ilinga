import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Badge, Card, CardBody, Skeleton } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';

interface CycleSummary {
  cycle: { id: string; seq: number; status: string };
  contentKeys: { code: string; value: unknown; version: number }[];
  artifactCount: number;
  competitorCount: number;
  reportCount: number;
}

interface CompareResult {
  a: CycleSummary;
  b: CycleSummary;
  diff: { code: string; a?: unknown; b?: unknown }[];
}

const valueText = (v: unknown): string => {
  if (v === undefined || v === null) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v && 'text' in (v as Record<string, unknown>)) {
    const t = (v as { text?: unknown }).text;
    return typeof t === 'string' ? t : JSON.stringify(v);
  }
  return JSON.stringify(v);
};

export const CycleCompare = (): JSX.Element => {
  const { vid } = useParams<{ vid: string }>();
  const [params] = useSearchParams();
  const { current } = useTenant();
  const a = params.get('a');
  const b = params.get('b');
  const [data, setData] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!current || !a || !b) return;
    setData(null);
    api
      .get<CompareResult>(`/v1/ventures/tenant/${current.id}/cycles/compare?a=${a}&b=${b}`)
      .then(setData)
      .catch((e: ApiError) => setError(`Status ${e.status}`));
  }, [current, a, b]);

  if (!current || !vid || !a || !b) {
    return (
      <p className="text-sm text-[color:var(--color-fg-muted)]">Pick two cycles to compare.</p>
    );
  }
  if (error) return <p className="text-sm text-[color:var(--color-danger)]">{error}</p>;
  if (!data) return <Skeleton height={200} />;

  return (
    <div className="space-y-6">
      <header>
        <Link to={`/ventures/${vid}`} className="text-xs text-[color:var(--color-fg-muted)]">
          ← Venture
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cycle compare: v{data.a.cycle.seq} vs v{data.b.cycle.seq}
        </h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {[data.a, data.b].map((s, i) => (
          <Card key={s.cycle.id}>
            <CardBody>
              <p className="text-sm font-semibold">
                {i === 0 ? 'Side A' : 'Side B'} · v{s.cycle.seq}{' '}
                <Badge tone={s.cycle.status === 'closed' ? 'neutral' : 'info'}>
                  {s.cycle.status}
                </Badge>
              </p>
              <p className="mt-2 text-xs text-[color:var(--color-fg-muted)]">
                {s.contentKeys.length} keys · {s.artifactCount} artifacts · {s.competitorCount}{' '}
                competitors · {s.reportCount} reports
              </p>
            </CardBody>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Content key diff</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-[color:var(--color-fg-subtle)]">
            <tr>
              <th className="py-2">Key</th>
              <th className="py-2">v{data.a.cycle.seq}</th>
              <th className="py-2">v{data.b.cycle.seq}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-border)]">
            {data.diff.map((row) => {
              const same =
                row.a !== undefined && row.b !== undefined && valueText(row.a) === valueText(row.b);
              return (
                <tr key={row.code} className={same ? '' : 'bg-[color:var(--color-warning)]/5'}>
                  <td className="py-2 align-top font-mono text-xs">{row.code}</td>
                  <td className="py-2 align-top text-xs">{valueText(row.a)}</td>
                  <td className="py-2 align-top text-xs">{valueText(row.b)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
};
