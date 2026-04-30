import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Field,
  Input,
  Modal,
  Skeleton,
  useToast,
} from '@ilinga/ui';
import { api, type ApiError } from '../../../lib/api';
import { useTenant } from '../../../lib/tenant';

interface Endpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

interface Delivery {
  id: string;
  eventType: string;
  status: string;
  attempts: number;
  lastResponseStatus: number | null;
  lastResponseBody: string | null;
  createdAt: string;
  deliveredAt: string | null;
}

const EVENT_OPTIONS = [
  'cycle.started',
  'cycle.complete',
  'report.rendered',
  'report.failed',
  'credit.low',
  'tenant.member.added',
];

export const SettingsWebhooks = (): JSX.Element => {
  const { current } = useTenant();
  const [endpoints, setEndpoints] = useState<Endpoint[] | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ url: '', events: [] as string[] });
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [deliveriesFor, setDeliveriesFor] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const toast = useToast();

  const loadDeliveries = async (endpointId: string): Promise<void> => {
    if (!current) return;
    setDeliveriesFor(endpointId);
    setDeliveries([]);
    try {
      const r = await api.get<{ deliveries: Delivery[] }>(
        `/v1/webhooks/tenant/${current.id}/${endpointId}/deliveries`,
      );
      setDeliveries(r.deliveries);
    } catch {
      toast.push({ variant: 'error', title: 'Could not load deliveries' });
    }
  };

  const replay = async (endpointId: string, deliveryId: string): Promise<void> => {
    if (!current) return;
    try {
      const r = await api.post<{ ok: boolean; status: number }>(
        `/v1/webhooks/tenant/${current.id}/${endpointId}/deliveries/${deliveryId}/replay`,
      );
      toast.push({
        variant: r.ok ? 'success' : 'error',
        title: r.ok ? 'Replayed' : 'Replay failed',
        body: `Endpoint returned ${r.status}.`,
      });
      void loadDeliveries(endpointId);
    } catch {
      toast.push({ variant: 'error', title: 'Replay failed' });
    }
  };

  const refresh = (): void => {
    if (!current) return;
    setEndpoints(null);
    api
      .get<{ endpoints: Endpoint[] }>(`/v1/webhooks/tenant/${current.id}`)
      .then((r) => setEndpoints(r.endpoints))
      .catch(() => setEndpoints([]));
  };

  useEffect(refresh, [current]);

  if (!current) return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace.</p>;

  const submit = async (): Promise<void> => {
    setSubmitting(true);
    try {
      const r = await api.post<{ id: string; secret: string }>(
        `/v1/webhooks/tenant/${current.id}`,
        form,
      );
      setRevealedSecret(r.secret);
      setOpen(false);
      setForm({ url: '', events: [] });
      refresh();
    } catch (e) {
      toast.push({
        variant: 'error',
        title: 'Could not register endpoint',
        body: `Status ${(e as ApiError).status}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const rotate = async (id: string): Promise<void> => {
    if (!window.confirm('Rotate the signing secret? Both old + new are accepted for 24 hours.'))
      return;
    const r = await api.post<{ secret: string }>(`/v1/webhooks/tenant/${current.id}/${id}/rotate`);
    setRevealedSecret(r.secret);
  };

  const test = async (id: string): Promise<void> => {
    const r = await api.post<{ ok: boolean; status: number }>(
      `/v1/webhooks/tenant/${current.id}/${id}/test`,
    );
    toast.push({
      variant: r.ok ? 'success' : 'error',
      title: r.ok ? 'Test event delivered' : 'Test failed',
      body: `Endpoint returned ${r.status}.`,
    });
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Webhooks</h2>
        <Button onClick={() => setOpen(true)}>Add endpoint</Button>
      </header>
      {endpoints === null && <Skeleton height={120} />}
      {endpoints && endpoints.length === 0 && (
        <EmptyState
          title="No webhook endpoints"
          body="We sign every payload with HMAC-SHA256. Rotation keeps the previous secret valid for 24 hours."
        />
      )}
      {endpoints && endpoints.length > 0 && (
        <ul className="space-y-2">
          {endpoints.map((e) => (
            <li key={e.id}>
              <Card>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.url}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.events.map((ev) => (
                          <Badge key={ev} tone="info">
                            {ev}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => test(e.id)}>
                        Send test
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => rotate(e.id)}>
                        Rotate secret
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void loadDeliveries(e.id)}
                      >
                        Deliveries
                      </Button>
                    </div>
                  </div>
                  {deliveriesFor === e.id && (
                    <div className="mt-3 border-t border-[color:var(--color-border)] pt-3">
                      {deliveries.length === 0 ? (
                        <p className="text-xs text-[color:var(--color-fg-muted)]">
                          No deliveries yet.
                        </p>
                      ) : (
                        <ul className="space-y-2 text-xs">
                          {deliveries.map((d) => (
                            <li
                              key={d.id}
                              className="flex flex-wrap items-start justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <span>
                                  <Badge tone={d.status === 'delivered' ? 'success' : 'warning'}>
                                    {d.status}
                                  </Badge>{' '}
                                  <strong>{d.eventType}</strong> · {d.lastResponseStatus ?? '—'} ·
                                  attempts {d.attempts}
                                </span>
                                {d.lastResponseBody && (
                                  <p className="mt-1 truncate text-[color:var(--color-fg-muted)]">
                                    {d.lastResponseBody.slice(0, 200)}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => void replay(e.id, d.id)}
                              >
                                Replay
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add webhook endpoint"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={submitting}>
              Register
            </Button>
          </>
        }
      >
        <Field label="URL" htmlFor="wh-url">
          <Input
            id="wh-url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://example.com/ilinga/webhook"
          />
        </Field>
        <Field label="Events" htmlFor="wh-events">
          <div className="flex flex-wrap gap-3 text-sm">
            {EVENT_OPTIONS.map((ev) => (
              <label key={ev} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.events.includes(ev)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      events: e.target.checked
                        ? [...form.events, ev]
                        : form.events.filter((x) => x !== ev),
                    })
                  }
                />
                {ev}
              </label>
            ))}
          </div>
        </Field>
      </Modal>

      <Modal
        open={revealedSecret !== null}
        onClose={() => setRevealedSecret(null)}
        title="Save this secret now"
        footer={<Button onClick={() => setRevealedSecret(null)}>I&apos;ve saved it</Button>}
      >
        <p className="text-sm">
          This secret is shown once. We store only its ciphertext. Verify webhook payloads with
          HMAC-SHA256 over the raw body.
        </p>
        <pre className="mt-3 overflow-x-auto rounded bg-[color:var(--color-accent-soft)] p-3 font-mono text-xs">
          {revealedSecret}
        </pre>
      </Modal>
    </section>
  );
};
