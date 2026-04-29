import { useState } from 'react';
import { Button, Card, CardBody, CardHeader, Field, Input, Textarea, useToast } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';

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
  const toast = useToast();

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

  return (
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
              onChange={(e) => setForm({ ...form, severity: e.target.value as 'info' | 'warning' })}
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
  );
};
