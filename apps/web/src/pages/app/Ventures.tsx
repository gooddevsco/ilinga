import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, EmptyState, Skeleton, useToast } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';
import { formatDateTZ } from '../../lib/format';

interface Venture {
  id: string;
  name: string;
  industry: string | null;
  geos: string[];
  brief: Record<string, unknown>;
  createdAt: string;
}

export const Ventures = (): JSX.Element => {
  const { current } = useTenant();
  const [ventures, setVentures] = useState<Venture[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!current) return;
    setVentures(null);
    setError(null);
    api
      .get<{ ventures: Venture[] }>(`/v1/ventures/tenant/${current.id}`)
      .then((r) => setVentures(r.ventures))
      .catch((e: ApiError) => {
        setError(`Could not load ventures (${e.status}).`);
        toast.push({ variant: 'error', title: 'Could not load ventures' });
      });
  }, [current, toast]);

  if (!current) {
    return (
      <EmptyState
        title="No workspace yet"
        body="Create or accept an invite to a workspace to get started."
      />
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Ventures</h1>
        <Link
          to="/ventures/new"
          className="inline-flex h-9 items-center rounded-md bg-[color:var(--color-accent)] px-4 text-sm text-[color:var(--color-accent-fg)]"
        >
          New venture
        </Link>
      </header>
      {error && (
        <p role="alert" className="text-sm text-[color:var(--color-danger)]">
          {error}
        </p>
      )}
      {ventures === null && !error && (
        <div className="space-y-2">
          <Skeleton height={64} />
          <Skeleton height={64} />
          <Skeleton height={64} />
        </div>
      )}
      {ventures && ventures.length === 0 && (
        <EmptyState
          title="Your first venture is one step away"
          body="A venture is a thesis you want to test. Add a brief, run an interview, render a report."
          cta={
            <Link
              to="/ventures/new"
              className="inline-flex h-9 items-center rounded-md bg-[color:var(--color-accent)] px-4 text-sm text-[color:var(--color-accent-fg)]"
            >
              Create venture
            </Link>
          }
        />
      )}
      {ventures && ventures.length > 0 && (
        <ul className="grid gap-3">
          {ventures.map((v) => (
            <li key={v.id}>
              <Link to={`/ventures/${v.id}`}>
                <Card>
                  <CardHeader>{v.name}</CardHeader>
                  <CardBody>
                    <p className="text-xs text-[color:var(--color-fg-muted)]">
                      {v.industry ?? 'no industry'} ·{' '}
                      {v.geos.length === 0 ? 'no geos' : v.geos.join(', ')} · created{' '}
                      {formatDateTZ(v.createdAt, 'UTC')}
                    </p>
                  </CardBody>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
