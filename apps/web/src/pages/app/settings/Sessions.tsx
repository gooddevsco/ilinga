import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, EmptyState, Skeleton, useToast } from '@ilinga/ui';
import { api, type ApiError } from '../../../lib/api';
import { formatDateTZ } from '../../../lib/format';

interface Session {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

export const SettingsSessions = (): JSX.Element => {
  const [items, setItems] = useState<Session[] | null>(null);
  const toast = useToast();

  const refresh = (): void => {
    setItems(null);
    api
      .get<{ sessions: Session[] }>('/v1/sessions')
      .then((r) => setItems(r.sessions))
      .catch(() => setItems([]));
  };
  useEffect(refresh, []);

  const revoke = async (id: string): Promise<void> => {
    if (!window.confirm('Revoke this session?')) return;
    try {
      await api.delete(`/v1/sessions/${id}`);
      toast.push({ variant: 'success', title: 'Session revoked' });
      refresh();
    } catch (e) {
      toast.push({
        variant: 'error',
        title: 'Revoke failed',
        body: `Status ${(e as ApiError).status}`,
      });
    }
  };

  const revokeAll = async (): Promise<void> => {
    if (!window.confirm('Sign out of every session except this one?')) return;
    await api.post('/v1/sessions/revoke-all');
    toast.push({ variant: 'success', title: 'Other sessions revoked' });
    refresh();
  };

  if (items === null) return <Skeleton height={200} />;
  if (items.length === 0)
    return <EmptyState title="No active sessions" body="Sign in to see them here." />;

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sessions</h2>
        <Button variant="secondary" onClick={revokeAll}>
          Sign out everywhere else
        </Button>
      </header>
      <ul className="space-y-2">
        {items.map((s) => (
          <li key={s.id}>
            <Card>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {s.userAgent ?? 'Unknown user agent'}
                    </p>
                    <p className="text-xs text-[color:var(--color-fg-muted)]">
                      IP {s.ip ?? '—'} · created {formatDateTZ(s.createdAt, 'UTC')} · last seen{' '}
                      {formatDateTZ(s.lastSeenAt, 'UTC')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.revokedAt ? (
                      <Badge tone="warning">revoked</Badge>
                    ) : (
                      <Button size="sm" variant="danger" onClick={() => void revoke(s.id)}>
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
};
