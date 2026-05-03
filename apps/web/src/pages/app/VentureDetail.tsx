import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, CardBody, CardHeader, Modal, Skeleton, useToast } from '@ilinga/ui';
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

interface CycleSummary {
  cycle: { id: string; seq: number; status: string; closedAt: string | null };
  contentKeys: { code: string; value: unknown; version: number }[];
  artifactCount: number;
  competitorCount: number;
  reportCount: number;
}

export const VentureDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const { current } = useTenant();
  const [venture, setVenture] = useState<Venture | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState<Cycle | null>(null);
  const [closeSummary, setCloseSummary] = useState<CycleSummary | null>(null);
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
          <Link to={`/ventures/${venture.id}/edit`} className="mt-3 inline-block text-sm underline">
            Edit brief
          </Link>
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
                    <Link
                      to={`/ventures/${venture.id}/cycles/${cy.id}/keys`}
                      className="text-xs underline"
                    >
                      Edit keys
                    </Link>
                    {cy.status === 'open' && (
                      <button
                        type="button"
                        className="text-xs text-[color:var(--color-warning)] underline"
                        onClick={async () => {
                          setCloseOpen(cy);
                          setCloseSummary(null);
                          try {
                            const r = await api.get<CycleSummary>(
                              `/v1/ventures/tenant/${current!.id}/cycles/${cy.id}/summary`,
                            );
                            setCloseSummary(r);
                          } catch {
                            toast.push({
                              variant: 'error',
                              title: 'Could not load cycle summary',
                            });
                          }
                        }}
                      >
                        Close
                      </button>
                    )}
                    {cy.status === 'closed' && <Badge tone="neutral">closed</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {cycles.length >= 2 && (
            <Link
              className="mt-3 block text-xs underline"
              to={`/ventures/${venture.id}/compare?a=${cycles[0]!.id}&b=${cycles[1]!.id}`}
            >
              Compare{' '}
              {cycles[0]!.seq === cycles[1]!.seq
                ? 'two'
                : `v${cycles[0]!.seq} vs v${cycles[1]!.seq}`}
            </Link>
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
      <Modal
        open={closeOpen !== null}
        onClose={() => setCloseOpen(null)}
        title={closeOpen ? `Close cycle v${closeOpen.seq}?` : 'Close cycle'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCloseOpen(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!closeOpen) return;
                try {
                  await api.post(`/v1/ventures/tenant/${current!.id}/cycles/${closeOpen.id}/close`);
                  toast.push({ variant: 'success', title: 'Cycle closed' });
                  setCloseOpen(null);
                  setCycles((prev) =>
                    prev.map((c) => (c.id === closeOpen.id ? { ...c, status: 'closed' } : c)),
                  );
                } catch {
                  toast.push({ variant: 'error', title: 'Close failed' });
                }
              }}
            >
              Close cycle
            </Button>
          </>
        }
      >
        {!closeSummary ? (
          <Skeleton height={120} />
        ) : (
          <div className="space-y-2 text-sm">
            <p>
              You are about to close the cycle. The interview answers and content keys are frozen
              and a new cycle would have to be cloned to continue work.
            </p>
            <ul className="list-disc pl-5 text-xs text-[color:var(--color-fg-muted)]">
              <li>{closeSummary.contentKeys.length} content key(s) frozen</li>
              <li>{closeSummary.artifactCount} artifact(s)</li>
              <li>{closeSummary.competitorCount} competitor(s)</li>
              <li>{closeSummary.reportCount} report(s)</li>
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
};
