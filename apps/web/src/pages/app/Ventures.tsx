import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, Eyebrow, Icons, Skeleton, Tag, useToast } from '@ilinga/ui';
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
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Eyebrow>Workspace · {current.displayName}</Eyebrow>
          <h1
            className="serif mt-1.5 text-[28px] tracking-tight"
            style={{ fontWeight: 500, letterSpacing: '-0.02em' }}
          >
            Ventures
          </h1>
        </div>
        <Link to="/ventures/new">
          <Button variant="primary" type="button">
            <Icons.plus /> New venture
          </Button>
        </Link>
      </header>
      {error && (
        <p role="alert" className="text-[13px] text-[color:var(--danger)]">
          {error}
        </p>
      )}
      {ventures === null && !error && (
        <div className="flex flex-col gap-2">
          <Skeleton height={72} />
          <Skeleton height={72} />
          <Skeleton height={72} />
        </div>
      )}
      {ventures && ventures.length === 0 && (
        <Card className="p-10 text-center">
          <Eyebrow>No ventures yet</Eyebrow>
          <h2 className="serif mt-3 text-[24px] tracking-tight" style={{ fontWeight: 500 }}>
            Your first venture is one step away.
          </h2>
          <p
            className="mx-auto mt-3 text-[14px] text-[color:var(--ink-mute)]"
            style={{ maxWidth: 480 }}
          >
            A venture is a thesis you want to test. Add a brief, run a structured interview, render
            a source-ready report.
          </p>
          <Link to="/ventures/new" className="mt-5 inline-flex">
            <Button variant="primary" size="lg" type="button">
              Brief your first venture <Icons.arrow />
            </Button>
          </Link>
        </Card>
      )}
      {ventures && ventures.length > 0 && (
        <ul className="grid gap-3">
          {ventures.map((v) => (
            <li key={v.id}>
              <Link
                to={`/ventures/${v.id}`}
                className="block transition-colors hover:bg-[color:var(--paper-1)]"
              >
                <Card className="flex items-center gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[15px]" style={{ fontWeight: 500 }}>
                        {v.name}
                      </span>
                      {v.industry && <Tag>{v.industry}</Tag>}
                    </div>
                    <div className="mono mt-1 text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
                      {v.geos.length === 0
                        ? 'NO GEOS'
                        : v.geos.map((g) => g.toUpperCase()).join(' · ')}{' '}
                      · CREATED {formatDateTZ(v.createdAt, 'UTC')}
                    </div>
                  </div>
                  <span className="text-[color:var(--ink-faint)]" aria-hidden="true">
                    <Icons.arrow />
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
