import { useEffect, useState } from 'react';
import { Badge, Card, CardBody, EmptyState, Skeleton } from '@ilinga/ui';
import { api, type ApiError } from '../../../lib/api';
import { useTenant } from '../../../lib/tenant';
import { formatDateTZ } from '../../../lib/format';

interface RequestRow {
  id: string;
  method: string;
  path: string;
  status: number;
  latencyMs: number;
  ip: string | null;
  actorUserId: string | null;
  apiTokenId: string | null;
  requestId: string | null;
  createdAt: string;
}

const tone = (status: number): 'success' | 'warning' | 'danger' | 'info' => {
  if (status >= 500) return 'danger';
  if (status >= 400) return 'warning';
  if (status >= 300) return 'info';
  return 'success';
};

export const SettingsApiRequests = (): JSX.Element => {
  const { current } = useTenant();
  const [rows, setRows] = useState<RequestRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!current) return;
    setRows(null);
    setError(null);
    api
      .get<{ requests: RequestRow[] }>(`/v1/tenants/${current.id}/api-requests?limit=200`)
      .then((r) => setRows(r.requests))
      .catch((e: ApiError) => setError(`Status ${e.status}`));
  }, [current]);

  if (!current) return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace.</p>;
  if (error) return <p className="text-sm text-[color:var(--color-danger)]">{error}</p>;
  if (rows === null) return <Skeleton height={240} />;
  if (rows.length === 0)
    return (
      <EmptyState
        title="No API activity yet"
        body="Requests from the web app, your API tokens, and webhook deliveries will appear here."
      />
    );

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-semibold">API requests</h2>
        <p className="text-xs text-[color:var(--color-fg-muted)]">
          Last 200 requests scoped to this workspace.
        </p>
      </header>
      <Card>
        <CardBody>
          <ul className="divide-y divide-[color:var(--color-border)]">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-2 text-xs">
                <Badge tone={tone(r.status)}>{r.status}</Badge>
                <code className="font-mono text-[12px]">{r.method}</code>
                <code className="truncate font-mono text-[12px]">{r.path}</code>
                <span className="ml-auto text-[color:var(--color-fg-muted)]">
                  {r.latencyMs}ms · {formatDateTZ(r.createdAt, 'UTC')}
                </span>
                {r.apiTokenId && <Badge tone="info">token</Badge>}
                {r.ip && <span className="font-mono text-[10px]">{r.ip}</span>}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </section>
  );
};
