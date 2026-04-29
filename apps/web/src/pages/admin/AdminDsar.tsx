import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Field,
  Modal,
  Skeleton,
  Textarea,
  useToast,
} from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { formatDateTZ } from '../../lib/format';

interface Request {
  id: string;
  userId: string;
  tenantId: string | null;
  kind: string;
  description: string | null;
  status: string;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export const AdminDsar = (): JSX.Element => {
  const [items, setItems] = useState<Request[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Request | null>(null);
  const [resolution, setResolution] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const refresh = (): void => {
    setItems(null);
    api
      .get<{ requests: Request[] }>('/v1/admin/dsar')
      .then((r) => setItems(r.requests))
      .catch((e: ApiError) => setError(e.status === 403 ? 'Platform admins only.' : `Status ${e.status}`));
  };
  useEffect(refresh, []);

  if (error) return <p className="text-sm text-[color:var(--color-danger)]">{error}</p>;
  if (items === null) return <Skeleton height={120} />;

  const submit = async (): Promise<void> => {
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.post(`/v1/admin/dsar/${editing.id}/resolve`, { resolution });
      toast.push({ variant: 'success', title: 'Resolved' });
      setEditing(null);
      setResolution('');
      refresh();
    } catch {
      toast.push({ variant: 'error', title: 'Could not resolve' });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0)
    return <EmptyState title="No DSAR requests" body="The queue is empty." />;

  return (
    <ul className="space-y-2">
      {items.map((r) => (
        <li key={r.id}>
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm">
                    <Badge tone={r.status === 'resolved' ? 'success' : 'warning'}>
                      {r.status}
                    </Badge>{' '}
                    <strong>{r.kind}</strong>
                    {r.description && <> — {r.description}</>}
                  </p>
                  <p className="text-xs text-[color:var(--color-fg-muted)]">
                    User <code>{r.userId.slice(0, 8)}…</code>
                    {r.tenantId && <> · tenant <code>{r.tenantId.slice(0, 8)}…</code></>} · filed{' '}
                    {formatDateTZ(r.createdAt, 'UTC')}
                  </p>
                  {r.resolution && (
                    <p className="mt-2 rounded bg-[color:var(--color-accent-soft)] px-3 py-2 text-xs">
                      {r.resolution}
                    </p>
                  )}
                </div>
                {r.status !== 'resolved' && (
                  <Button size="sm" onClick={() => setEditing(r)}>
                    Resolve
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </li>
      ))}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Resolve request"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={submitting} onClick={submit}>
              Resolve
            </Button>
          </>
        }
      >
        <Field label="Resolution notes" htmlFor="dsar-res">
          <Textarea
            id="dsar-res"
            rows={5}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          />
        </Field>
      </Modal>
    </ul>
  );
};
