import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, CardBody, CardHeader, Skeleton, useToast } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';
import { formatDateTZ } from '../../lib/format';

interface Venture {
  id: string;
  name: string;
  industry: string | null;
  geos: string[];
  brief: { thesis?: string; wedge?: string };
  createdAt: string;
}

interface Cycle {
  id: string;
  seq: number;
  status: string;
}

export const VentureDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const { current } = useTenant();
  const [venture, setVenture] = useState<Venture | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [error, setError] = useState<string | null>(null);
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
      <div>
        <p className="text-sm text-[color:var(--color-danger)]">{error}</p>
        <Link to="/ventures" className="text-sm underline">
          Back to ventures
        </Link>
      </div>
    );
  }
  if (!venture) {
    return (
      <div className="space-y-3">
        <Skeleton width={240} height={28} />
        <Skeleton height={120} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/ventures" className="text-xs text-[color:var(--color-fg-muted)]">
            ← Ventures
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{venture.name}</h1>
          <p className="text-xs text-[color:var(--color-fg-muted)]">
            {venture.industry ?? 'industry tbd'} ·{' '}
            {venture.geos.length === 0 ? 'no geos' : venture.geos.join(', ')} · created{' '}
            {formatDateTZ(venture.createdAt, 'UTC')}
          </p>
        </div>
        <div className="flex gap-2">
          {openCycle ? (
            <>
              <Link
                to={`/ventures/${venture.id}/cycles/${openCycle.id}/interview`}
                className="inline-flex h-9 items-center rounded-md bg-[color:var(--color-accent)] px-4 text-sm text-[color:var(--color-accent-fg)]"
              >
                Open interview
              </Link>
              <Link
                to={`/ventures/${venture.id}/cycles/${openCycle.id}/synthesis`}
                className="inline-flex h-9 items-center rounded-md border border-[color:var(--color-border)] px-4 text-sm"
              >
                Synthesis
              </Link>
              <Link
                to={`/ventures/${venture.id}/cycles/${openCycle.id}/reports`}
                className="inline-flex h-9 items-center rounded-md border border-[color:var(--color-border)] px-4 text-sm"
              >
                Reports
              </Link>
            </>
          ) : (
            <span className="text-xs text-[color:var(--color-fg-muted)]">No open cycle</span>
          )}
        </div>
      </header>
      <Card>
        <CardHeader>Brief</CardHeader>
        <CardBody>
          <p className="text-sm">
            <span className="text-[color:var(--color-fg-muted)]">Thesis:</span>{' '}
            {venture.brief.thesis ?? '—'}
          </p>
          {venture.brief.wedge && (
            <p className="mt-2 text-sm">
              <span className="text-[color:var(--color-fg-muted)]">Wedge:</span>{' '}
              {venture.brief.wedge}
            </p>
          )}
          <button
            type="button"
            className="mt-3 text-sm underline"
            onClick={async () => {
              const next = window.prompt('New thesis', venture.brief.thesis ?? '');
              if (next === null) return;
              try {
                await api.patch(`/v1/ventures/tenant/${current!.id}/${venture.id}/brief`, {
                  brief: { ...venture.brief, thesis: next },
                });
                toast.push({ variant: 'success', title: 'Brief updated' });
                setVenture({ ...venture, brief: { ...venture.brief, thesis: next } });
              } catch {
                toast.push({ variant: 'error', title: 'Could not update brief' });
              }
            }}
          >
            Edit thesis
          </button>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>Cycles</CardHeader>
        <CardBody>
          {cycles.length === 0 ? (
            <p className="text-sm text-[color:var(--color-fg-muted)]">No cycles yet.</p>
          ) : (
            <ul className="space-y-2">
              {cycles.map((cy) => (
                <li
                  key={cy.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[color:var(--color-border)] px-3 py-2 text-sm"
                >
                  <div>
                    Cycle <strong>v{cy.seq}</strong> · {cy.status}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/ventures/${venture.id}/cycles/${cy.id}/interview`}
                      className="text-xs underline"
                    >
                      Interview
                    </Link>
                    <Link
                      to={`/ventures/${venture.id}/cycles/${cy.id}/synthesis`}
                      className="text-xs underline"
                    >
                      Synthesis
                    </Link>
                    <Link
                      to={`/ventures/${venture.id}/cycles/${cy.id}/reports`}
                      className="text-xs underline"
                    >
                      Reports
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="secondary"
            className="mt-4"
            onClick={async () => {
              if (!openCycle) return;
              try {
                const r = await api.post<{ id: string; seq: number }>(
                  `/v1/ventures/tenant/${current!.id}/cycles/clone`,
                  { cycleId: openCycle.id },
                );
                toast.push({ variant: 'success', title: `Cloned to v${r.seq}` });
                setCycles((prev) => [...prev, { id: r.id, seq: r.seq, status: 'open' }]);
              } catch {
                toast.push({ variant: 'error', title: 'Could not clone cycle' });
              }
            }}
            disabled={!openCycle}
          >
            Clone open cycle
          </Button>
        </CardBody>
      </Card>
    </div>
  );
};
