import { useEffect, useState } from 'react';
import { Button, Card, EmptyState, Eyebrow, Icons, Skeleton, Tag, useToast } from '@ilinga/ui';
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

  if (!current) return <p className="text-[13px] text-[color:var(--ink-mute)]">No workspace.</p>;
  if (error) return <p className="text-[13px] text-[color:var(--danger)]">{error}</p>;

  const restore = async (id: string): Promise<void> => {
    if (!window.confirm('Restore this item?')) return;
    await api.post(`/v1/trash/tenant/${current.id}/restore/${id}`);
    toast.push({ variant: 'success', title: 'Restored' });
    refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Eyebrow>Trash</Eyebrow>
        <h1
          className="serif mt-1 text-[28px] tracking-tight"
          style={{ fontWeight: 500, letterSpacing: '-0.02em' }}
        >
          Recently deleted.
        </h1>
        <p className="mt-1 text-[13px] text-[color:var(--ink-mute)]">
          Items live here for their restore window before they’re purged.
        </p>
      </header>

      {items === null && <Skeleton height={140} />}
      {items && items.length === 0 && (
        <Card className="p-8">
          <EmptyState
            title="Trash is empty"
            body="Deleted items appear here for the restore window."
          />
        </Card>
      )}
      {items && items.length > 0 && (
        <Card className="overflow-hidden">
          <table className="cmp">
            <thead>
              <tr>
                <th>Type</th>
                <th>ID</th>
                <th>Deleted</th>
                <th>Purged after</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Tag tone="ochre">{t.targetTable.toUpperCase()}</Tag>
                  </td>
                  <td className="mono text-[12px] text-[color:var(--ink-mute)]">
                    {t.targetId.slice(0, 8)}…
                  </td>
                  <td className="mono text-[12px] text-[color:var(--ink-mute)]">
                    {formatDateTZ(t.deletedAt, 'UTC')}
                  </td>
                  <td className="mono text-[12px] text-[color:var(--ink-mute)]">
                    {formatDateTZ(t.restoreDeadline, 'UTC')}
                  </td>
                  <td className="text-right">
                    <Button size="sm" variant="primary" type="button" onClick={() => restore(t.id)}>
                      <Icons.cycle /> Restore
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
