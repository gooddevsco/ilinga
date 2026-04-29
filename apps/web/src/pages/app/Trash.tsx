import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, EmptyState, Skeleton, useToast } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';
import { formatDateTZ } from '../../lib/format';

interface Tombstone {
  id: string;
  targetTable: string;
  targetId: string;
  deletedAt: string;
  restoreDeadline: string;
}

export const Trash = (): JSX.Element => {
  const { current } = useTenant();
  const [items, setItems] = useState<Tombstone[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const refresh = (): void => {
    if (!current) return;
    setItems(null);
    api
      .get<{ items: Tombstone[] }>(`/v1/trash/tenant/${current.id}`)
      .then((r) => setItems(r.items))
      .catch((e: ApiError) => setError(`Status ${e.status}`));
  };
  useEffect(refresh, [current]);

  if (!current) return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace.</p>;
  if (error) return <p className="text-sm text-[color:var(--color-danger)]">{error}</p>;
  if (items === null) return <Skeleton height={120} />;
  if (items.length === 0)
    return <EmptyState title="Trash is empty" body="Deleted items appear here for the restore window." />;

  const restore = async (id: string): Promise<void> => {
    if (!window.confirm('Restore this item?')) return;
    await api.post(`/v1/trash/tenant/${current.id}/restore/${id}`);
    toast.push({ variant: 'success', title: 'Restored' });
    refresh();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Trash</h1>
      <ul className="space-y-2">
        {items.map((t) => (
          <li key={t.id}>
            <Card>
              <CardBody>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      <Badge tone="warning">{t.targetTable}</Badge>{' '}
                      <code>{t.targetId.slice(0, 8)}…</code>
                    </p>
                    <p className="text-xs text-[color:var(--color-fg-muted)]">
                      Deleted {formatDateTZ(t.deletedAt, 'UTC')} · purged after{' '}
                      {formatDateTZ(t.restoreDeadline, 'UTC')}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => restore(t.id)}>
                    Restore
                  </Button>
                </div>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
};
