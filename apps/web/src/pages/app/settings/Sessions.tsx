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

interface TrustedDevice {
  id: string;
  label: string | null;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt: string | null;
  impossibleTravelFlagged: boolean;
}

export const SettingsSessions = (): JSX.Element => {
  const [items, setItems] = useState<Session[] | null>(null);
  const [devices, setDevices] = useState<TrustedDevice[] | null>(null);
  const toast = useToast();

  const refresh = (): void => {
    setItems(null);
    setDevices(null);
    api
      .get<{ sessions: Session[] }>('/v1/sessions')
      .then((r) => setItems(r.sessions))
      .catch(() => setItems([]));
    api
      .get<{ devices: TrustedDevice[] }>('/v1/sessions/devices')
      .then((r) => setDevices(r.devices))
      .catch(() => setDevices([]));
  };
  useEffect(refresh, []);

  const revokeDevice = async (id: string): Promise<void> => {
    if (!window.confirm('Forget this trusted device?')) return;
    try {
      await api.delete(`/v1/sessions/devices/${id}`);
      toast.push({ variant: 'success', title: 'Device forgotten' });
      refresh();
    } catch (e) {
      toast.push({
        variant: 'error',
        title: 'Forget failed',
        body: `Status ${(e as ApiError).status}`,
      });
    }
  };

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

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sessions</h2>
          <Button variant="secondary" onClick={revokeAll}>
            Sign out everywhere else
          </Button>
        </header>
        {items.length === 0 ? (
          <EmptyState title="No active sessions" body="Sign in to see them here." />
        ) : (
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
        )}
      </section>

      <section className="space-y-3">
        <header>
          <h2 className="text-lg font-semibold">Trusted devices</h2>
          <p className="text-xs text-[color:var(--color-fg-muted)]">
            Devices that skip the magic-link step on subsequent sign-ins.
          </p>
        </header>
        {devices === null ? (
          <Skeleton height={120} />
        ) : devices.length === 0 ? (
          <EmptyState
            title="No trusted devices"
            body="Trusted devices appear here once you confirm a sign-in."
          />
        ) : (
          <ul className="space-y-2">
            {devices.map((d) => (
              <li key={d.id}>
                <Card>
                  <CardBody>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {d.label ?? 'Unnamed device'}
                        </p>
                        <p className="text-xs text-[color:var(--color-fg-muted)]">
                          Last seen {formatDateTZ(d.lastSeenAt, 'UTC')} · expires{' '}
                          {formatDateTZ(d.expiresAt, 'UTC')}
                          {d.impossibleTravelFlagged ? ' · flagged' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {d.revokedAt ? (
                          <Badge tone="warning">forgotten</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => void revokeDevice(d.id)}
                          >
                            Forget
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
