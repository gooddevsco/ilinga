import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Skeleton,
  Textarea,
  useToast,
} from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { formatDateTZ } from '../../lib/format';

interface Window {
  id: string;
  startsAt: string;
  endsAt: string;
  message: string;
  severity: 'info' | 'warning';
  published: boolean;
  affectsComponents: string[];
}

export const AdminMaintenance = (): JSX.Element => {
  const [form, setForm] = useState({
    startsAt: '',
    endsAt: '',
    message: '',
    severity: 'info' as 'info' | 'warning',
    affectsComponents: '',
    published: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [windows, setWindows] = useState<Window[] | null>(null);
  const toast = useToast();

  const refresh = (): void => {
    setWindows(null);
    api
      .get<{ windows: Window[] }>('/v1/admin/maintenance')
      .then((r) => setWindows(r.windows))
      .catch((e: ApiError) => {
        toast.push({
          variant: 'error',
          title: 'Could not load',
          body: e.status === 403 ? 'Platform admins only.' : `Status ${e.status}`,
        });
        setWindows([]);
      });
  };
  useEffect(refresh, []);

  const submit = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await api.post('/v1/admin/maintenance', {
        ...form,
        affectsComponents: form.affectsComponents
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      toast.push({ variant: 'success', title: 'Maintenance window scheduled' });
      setForm((f) => ({ ...f, message: '', affectsComponents: '' }));
      refresh();
    } catch (e) {
      toast.push({
        variant: 'error',
        title: 'Could not schedule',
        body: `Status ${(e as ApiError).status}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string): Promise<void> => {
    if (!window.confirm('Cancel this maintenance window?')) return;
    await api.delete(`/v1/admin/maintenance/${id}`);
    refresh();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>Schedule maintenance window</CardHeader>
        <CardBody>
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Starts at (UTC)" htmlFor="m-start">
                <Input
                  id="m-start"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </Field>
              <Field label="Ends at (UTC)" htmlFor="m-end">
                <Input
                  id="m-end"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Message" htmlFor="m-msg">
              <Textarea
                id="m-msg"
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </Field>
            <Field label="Severity" htmlFor="m-sev">
              <select
                id="m-sev"
                value={form.severity}
                onChange={(e) =>
                  setForm({ ...form, severity: e.target.value as 'info' | 'warning' })
                }
                className="block h-10 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 text-sm"
              >
                <option value="info">info</option>
                <option value="warning">warning</option>
              </select>
            </Field>
            <Field label="Affected components (comma-separated)" htmlFor="m-comp">
              <Input
                id="m-comp"
                value={form.affectsComponents}
                onChange={(e) => setForm({ ...form, affectsComponents: e.target.value })}
                placeholder="API, Render workers"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              Publish to status page immediately
            </label>
            <Button onClick={submit} loading={submitting}>
              Schedule window
            </Button>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>Scheduled windows</CardHeader>
        <CardBody>
          {windows === null && <Skeleton height={120} />}
          {windows && windows.length === 0 && (
            <EmptyState title="No windows" body="Nothing scheduled or active right now." />
          )}
          {windows && windows.length > 0 && (
            <ul className="space-y-2">
              {windows.map((w) => (
                <li
                  key={w.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-[color:var(--color-border)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{w.message}</p>
                    <p className="text-xs text-[color:var(--color-fg-muted)]">
                      {formatDateTZ(w.startsAt, 'UTC')} → {formatDateTZ(w.endsAt, 'UTC')}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge tone={w.severity === 'warning' ? 'warning' : 'info'}>
                        {w.severity}
                      </Badge>
                      {!w.published && <Badge tone="neutral">draft</Badge>}
                      {w.affectsComponents.map((c) => (
                        <Badge key={c} tone="info">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => remove(w.id)}>
                    Cancel
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
