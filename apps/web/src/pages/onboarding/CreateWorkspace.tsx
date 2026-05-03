import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardBody, CardHeader, Field, Input, useToast } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';

export const CreateWorkspace = (): JSX.Element => {
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { refresh, setCurrent } = useTenant();

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      toast.push({
        variant: 'warning',
        title: 'Name is too short',
        body: 'Use at least 2 characters.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const r = await api.post<{ id: string; slug: string }>('/v1/tenants', {
        displayName: displayName.trim(),
      });
      await refresh();
      setCurrent({
        id: r.id,
        slug: r.slug,
        displayName: displayName.trim(),
        role: 'owner',
      });
      toast.push({ variant: 'success', title: 'Workspace ready' });
      navigate('/dashboard');
    } catch (err) {
      toast.push({
        variant: 'error',
        title: 'Could not create workspace',
        body: `Status ${(err as ApiError).status}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg py-12">
      <Card>
        <CardHeader>Create your first workspace</CardHeader>
        <CardBody>
          <p className="text-sm text-[color:var(--color-fg-muted)]">
            A workspace is a tenant. You own it. Invite teammates and create ventures inside it. You
            can rename it later.
          </p>
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <Field
              label="Workspace name"
              htmlFor="ws-name"
              hint="Usually your company name. Visible to anyone you invite."
            >
              <Input
                id="ws-name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Northwind Cargo"
                autoFocus
              />
            </Field>
            <Button type="submit" loading={submitting} className="w-full">
              Create workspace
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
