import { useState } from 'react';
import { Button, Field, Modal, Textarea, useToast } from '@ilinga/ui';
import { api } from '../../lib/api';

const MAX_LOG_ENTRIES = 10;
const recentRequests: { method: string; path: string; status: number; at: number }[] = [];

if (typeof window !== 'undefined') {
  const origFetch = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const res = await origFetch(...args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const method = (args[1]?.method ?? (args[0] instanceof Request ? args[0].method : 'GET')) as string;
      recentRequests.push({ method, path: url, status: res.status, at: Date.now() });
      if (recentRequests.length > MAX_LOG_ENTRIES) recentRequests.shift();
    } catch {
      /* ignore */
    }
    return res;
  };
}

export const BugReportWidget = (): JSX.Element => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const submit = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await api.post('/v1/internal/bug', {
        description,
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        recentRequests,
      });
      toast.push({ variant: 'success', title: 'Report sent', body: 'Thank you — the team will look into it.' });
      setDescription('');
      setOpen(false);
    } catch {
      toast.push({ variant: 'error', title: 'Could not send report' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-30 inline-flex h-9 items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-4 text-xs shadow-[var(--shadow-md)]"
        aria-label="Report a bug"
      >
        Report bug
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Report a bug"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={submitting}>
              Send report
            </Button>
          </>
        }
      >
        <p className="text-sm text-[color:var(--color-fg-muted)]">
          We attach the current URL, your browser, viewport size, and the last {MAX_LOG_ENTRIES}{' '}
          API requests. We do not capture your screen.
        </p>
        <Field label="What went wrong?" htmlFor="bug-desc">
          <Textarea
            id="bug-desc"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you expected vs what happened."
          />
        </Field>
      </Modal>
    </>
  );
};
