import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, EmptyState, Skeleton, useToast } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { formatDateTZ } from '../../lib/format';

interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export const Notifications = (): JSX.Element => {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const refresh = (): void => {
    api
      .get<{ notifications: Notification[] }>('/v1/notifications')
      .then((r) => setItems(r.notifications))
      .catch((e: ApiError) => setError(`Status ${e.status}`));
  };
  useEffect(refresh, []);

  if (error) return <p className="text-sm text-[color:var(--color-danger)]">{error}</p>;
  if (items === null) return <Skeleton height={200} />;
  if (items.length === 0)
    return <EmptyState title="Inbox is empty" body="Notifications will appear here." />;

  const markAll = async (): Promise<void> => {
    await api.post('/v1/notifications/read-all');
    toast.push({ variant: 'success', title: 'All marked read' });
    refresh();
  };

  const markOne = async (id: string): Promise<void> => {
    await api.post(`/v1/notifications/${id}/read`);
    refresh();
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <Button variant="secondary" onClick={markAll}>
          Mark all read
        </Button>
      </header>
      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id}>
            <Card>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {n.title} {!n.readAt && <Badge tone="info">new</Badge>}
                    </p>
                    {n.body && (
                      <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">{n.body}</p>
                    )}
                    <p className="mt-1 text-xs text-[color:var(--color-fg-subtle)]">
                      {formatDateTZ(n.createdAt, 'UTC')} · {n.kind}
                    </p>
                  </div>
                  {!n.readAt && (
                    <Button size="sm" variant="secondary" onClick={() => void markOne(n.id)}>
                      Mark read
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
};
