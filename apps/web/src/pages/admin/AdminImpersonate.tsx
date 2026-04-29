import { useState } from 'react';
import { Button, Card, CardBody, CardHeader, Field, Input, Textarea, useToast } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';

export const AdminImpersonate = (): JSX.Element => {
  const [form, setForm] = useState({
    impersonatedUserId: '',
    tenantId: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const submit = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await api.post('/v1/admin/impersonate', form);
      toast.push({
        variant: 'warning',
        title: 'Impersonation session started',
        body: 'A persistent banner will appear on every page until you end it. Audit-logged.',
      });
      setForm({ impersonatedUserId: '', tenantId: '', reason: '' });
    } catch (e) {
      toast.push({
        variant: 'error',
        title: 'Could not start session',
        body: `Status ${(e as ApiError).status}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>Start impersonation session</CardHeader>
      <CardBody>
        <p className="text-sm text-[color:var(--color-fg-muted)]">
          Use only for support requests with a clear customer authorisation. Every action is
          attributed to both you (impersonator) and the impersonated user.
        </p>
        <div className="mt-3 space-y-3">
          <Field label="User id to impersonate" htmlFor="i-user">
            <Input
              id="i-user"
              value={form.impersonatedUserId}
              onChange={(e) => setForm({ ...form, impersonatedUserId: e.target.value })}
            />
          </Field>
          <Field label="Tenant id" htmlFor="i-tenant">
            <Input
              id="i-tenant"
              value={form.tenantId}
              onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
            />
          </Field>
          <Field label="Reason" htmlFor="i-reason">
            <Textarea
              id="i-reason"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Customer ticket #1234 — they cannot reproduce a render failure."
            />
          </Field>
          <Button variant="danger" onClick={submit} loading={submitting}>
            Start impersonation
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
