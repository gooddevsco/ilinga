import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Skeleton,
  Textarea,
  useToast,
} from '@ilinga/ui';

interface Context {
  cycleId: string;
  label: string | null;
}

const baseUrl =
  (import.meta.env['VITE_API_ORIGIN'] as string | undefined) ?? 'http://localhost:3001';

const callApi = async (path: string, init?: RequestInit): Promise<Response> =>
  fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

export const StakeholderPortal = (): JSX.Element => {
  const { token } = useParams<{ token: string }>();
  const [context, setContext] = useState<Context | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [optedOut, setOptedOut] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!token) return;
    callApi(`/v1/stakeholder/${token}/context`)
      .then(async (r) => {
        if (r.ok) setContext((await r.json()) as Context);
        else setError(`Status ${r.status} — link invalid or expired.`);
      })
      .catch(() => setError('Could not load.'));
  }, [token]);

  if (!token) return <p>Bad link.</p>;
  if (error) {
    return (
      <main className="mx-auto max-w-md py-16">
        <h1 className="text-2xl font-semibold">Sorry, this link is no longer valid</h1>
        <p className="mt-3 text-sm text-[color:var(--color-fg-muted)]">{error}</p>
      </main>
    );
  }
  if (!context) {
    return (
      <main className="mx-auto max-w-md py-16">
        <Skeleton height={120} />
      </main>
    );
  }

  if (optedOut) {
    return (
      <main className="mx-auto max-w-md py-16">
        <h1 className="text-2xl font-semibold">You&apos;re opted out</h1>
        <p className="mt-3 text-sm text-[color:var(--color-fg-muted)]">
          We won&apos;t email you about this venture again.
        </p>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-md py-16">
        <h1 className="text-2xl font-semibold">Thanks for your feedback</h1>
        <p className="mt-3 text-sm text-[color:var(--color-fg-muted)]">
          The team has been notified. You can close this tab.
        </p>
      </main>
    );
  }

  const submit = async (): Promise<void> => {
    if (!freeText.trim()) {
      toast.push({
        variant: 'warning',
        title: 'Add some feedback first',
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await callApi(`/v1/stakeholder/${token}/respond`, {
        method: 'POST',
        body: JSON.stringify({ freeText }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSubmitted(true);
    } catch {
      toast.push({ variant: 'error', title: 'Could not submit' });
    } finally {
      setSubmitting(false);
    }
  };

  const optOut = async (): Promise<void> => {
    if (!window.confirm('Stop receiving emails about this venture?')) return;
    await callApi(`/v1/stakeholder/${token}/opt-out`, { method: 'POST' });
    setOptedOut(true);
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <header>
        <p className="text-xs uppercase tracking-wide text-[color:var(--color-fg-subtle)]">
          Ilinga · stakeholder feedback
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {context.label ? `Hi ${context.label},` : 'Hi,'} share what you&apos;re seeing
        </h1>
        <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
          Your honest read helps the team test the thesis. Nothing you write is shared with anyone
          outside the team.
        </p>
      </header>

      <Card className="mt-6">
        <CardHeader>Free-text feedback</CardHeader>
        <CardBody>
          <Field label="Your reply" htmlFor="sh-text">
            <Textarea
              id="sh-text"
              rows={8}
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="What feels right? What feels off? What questions does this raise?"
            />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={submit} loading={submitting}>
              Submit feedback
            </Button>
            <Button variant="secondary" onClick={optOut}>
              Don&apos;t email me about this again
            </Button>
          </div>
        </CardBody>
      </Card>

      <p className="mt-6 text-xs text-[color:var(--color-fg-subtle)]">
        Privacy: your reply is stored encrypted alongside the cycle. Read our{' '}
        <a href="/legal/privacy" className="underline">
          privacy policy
        </a>
        .
      </p>
    </main>
  );
};
