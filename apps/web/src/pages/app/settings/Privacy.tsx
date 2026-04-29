import { useState } from 'react';
import { Button, Card, CardBody, CardHeader, Field, Modal, Textarea, useToast } from '@ilinga/ui';
import { api } from '../../../lib/api';
import { useTenant } from '../../../lib/tenant';

const KINDS = ['access', 'rectification', 'erasure', 'portability', 'restriction'] as const;

export const SettingsPrivacy = (): JSX.Element => {
  const { current } = useTenant();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof KINDS)[number]>('access');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const submit = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await api.post('/v1/admin/dsar', {
        kind,
        description,
        tenantId: current?.id,
      });
      toast.push({ variant: 'success', title: 'Request received', body: 'We respond within 30 days.' });
      setOpen(false);
      setDescription('');
    } catch {
      toast.push({ variant: 'error', title: 'Could not submit request' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>Privacy</CardHeader>
      <CardBody>
        <p className="text-sm text-[color:var(--color-fg-muted)]">
          Under GDPR you may request access to, rectification of, or erasure of your personal data;
          the right to data portability; and the right to restriction of processing.
        </p>
        <Button className="mt-3" onClick={() => setOpen(true)}>
          File a privacy request
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="File privacy request"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button loading={submitting} onClick={submit}>
                Submit
              </Button>
            </>
          }
        >
          <Field label="Kind" htmlFor="dsar-kind">
            <select
              id="dsar-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
              className="block h-10 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 text-sm"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Details" htmlFor="dsar-desc" hint="Optional but helpful for the team.">
            <Textarea
              id="dsar-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </Modal>
      </CardBody>
    </Card>
  );
};
