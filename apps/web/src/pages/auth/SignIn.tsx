import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Field, Input, useToast } from '@ilinga/ui';
import { api } from '../../lib/api';

export const SignIn = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/v1/auth/magic-link/request', { email, purpose: 'signin' });
      setSent(true);
      toast.push({
        variant: 'success',
        title: 'Check your inbox',
        body: 'If we know that email, we just sent a sign-in link.',
      });
    } catch {
      // anti-enumeration: still success copy
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-md py-16">
        <h1 className="text-2xl font-semibold">Check your inbox</h1>
        <p className="mt-3 text-sm text-[color:var(--color-fg-muted)]">
          We sent a sign-in link to <strong>{email}</strong>. The link expires in 15 minutes.
        </p>
        <p className="mt-3 text-xs text-[color:var(--color-fg-subtle)]">
          Didn&apos;t receive anything? Check spam, or
          <button
            type="button"
            onClick={() => setSent(false)}
            className="ml-1 underline"
          >
            try a different email
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="text-2xl font-semibold">Sign in to Ilinga</h1>
      <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
        We&apos;ll email you a one-time link.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Email" htmlFor="signin-email">
          <Input
            id="signin-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Button type="submit" loading={submitting} className="w-full">
          Email me a sign-in link
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-[color:var(--color-fg-subtle)]">
        <span className="h-px flex-1 bg-[color:var(--color-border)]" />
        OR
        <span className="h-px flex-1 bg-[color:var(--color-border)]" />
      </div>
      <a
        href="/v1/auth/google/start"
        className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[color:var(--color-border)] text-sm font-medium"
      >
        Continue with Google
      </a>
      <p className="mt-6 text-center text-xs text-[color:var(--color-fg-muted)]">
        New here?{' '}
        <Link to="/sign-up" className="underline">
          Create an account
        </Link>
      </p>
    </div>
  );
};
