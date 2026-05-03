import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardBody, EmptyState, Skeleton } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';
import { formatDateTZ } from '../../lib/format';

interface Entry {
  id: string;
  action: string;
  actorUserId: string | null;
  targetTable: string | null;
  targetId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export const Activity = (): JSX.Element => {
  const { vid, cid } = useParams<{ vid: string; cid: string }>();
  const { current } = useTenant();
  const [items, setItems] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!current || !cid) return;
    api
      .get<{ activity: Entry[] }>(`/v1/activity/tenant/${current.id}/cycle/${cid}`)
      .then((r) => setItems(r.activity))
      .catch((e: ApiError) => setError(`Status ${e.status}`));
  }, [current, cid]);

  if (!current || !vid || !cid)
    return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace selected.</p>;
  if (error) return <p className="text-sm text-[color:var(--color-danger)]">{error}</p>;
  if (items === null) return <Skeleton height={200} />;
  if (items.length === 0)
    return <EmptyState title="No activity yet" body="Audit-logged actions will show up here." />;

  return (
    <div className="space-y-4">
      <header>
        <Link to={`/ventures/${vid}`} className="text-xs text-[color:var(--color-fg-muted)]">
          ← Venture
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
      </header>
      <Card>
        <CardBody>
          <ol className="space-y-2 text-sm">
            {items.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-2">
                <span className="font-mono text-xs text-[color:var(--color-fg-subtle)]">
                  {formatDateTZ(e.createdAt, 'UTC')}
                </span>
                <strong>{e.action}</strong>
                {e.actorUserId && (
                  <span className="text-[color:var(--color-fg-muted)]">
                    by {e.actorUserId.slice(0, 8)}…
                  </span>
                )}
                {e.targetTable && (
                  <span className="text-[color:var(--color-fg-muted)]">
                    on {e.targetTable}/{e.targetId?.slice(0, 8)}…
                  </span>
                )}
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
};
