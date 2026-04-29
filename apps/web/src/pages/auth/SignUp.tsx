import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Field, Input, useToast } from '@ilinga/ui';
import { api } from '../../lib/api';

export const SignUp = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const [accept, setAccept] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  if (sent) {
    return (
      <div className="mx-auto max-w-md py-16">
        <h1 className="text-2xl font-semibold">Confirm your email to continue</h1>
        <p className="mt-3 text-sm text-[color:var(--color-fg-muted)]">
          We sent a confirmation link to <strong>{email}</strong>. Click it within 15 minutes
          to finish creating your account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="text-2xl font-semibold">Create your Ilinga account</h1>
      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!accept) {
            toast.push({
              variant: 'warning',
              title: 'Please accept the terms',
              body: 'You need to accept the terms of service and privacy policy to continue.',
            });
            return;
          }
          setSubmitting(true);
          try {
            await api.post('/v1/auth/magic-link/request', { email, purpose: 'signup' });
          } finally {
            setSent(true);
            setSubmitting(false);
          }
        }}
      >
        <Field label="Email" htmlFor="signup-email">
          <Input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <label className="flex items-start gap-2 text-xs text-[color:var(--color-fg-muted)]">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-1"
          />
          <span>
            I agree to the{' '}
            <Link to="/legal/terms" className="underline">
              terms
            </Link>{' '}
            and{' '}
            <Link to="/legal/privacy" className="underline">
              privacy policy
            </Link>
            .
          </span>
        </label>
        <Button type="submit" loading={submitting} className="w-full">
          Create account
        </Button>
      </form>
    </div>
  );
};
