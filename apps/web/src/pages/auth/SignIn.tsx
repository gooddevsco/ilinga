import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Eyebrow, Field, Input, useToast, cn } from '@ilinga/ui';
import { api, baseUrl } from '../../lib/api';

type Mode = 'magic' | 'password';
type Step = 'method' | 'sent';

export const SignIn = (): JSX.Element => {
  const [step, setStep] = useState<Step>('method');
  const [mode, setMode] = useState<Mode>('magic');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr('Use your work email.');
      return;
    }
    setErr('');
    setSubmitting(true);
    try {
      await api.post('/v1/auth/magic-link/request', { email, purpose: 'signin' });
      setStep('sent');
      toast.push({
        variant: 'success',
        title: 'Check your inbox',
        body: 'If we know that email, we just sent a sign-in link.',
      });
    } catch {
      // anti-enumeration: still positive copy
      setStep('sent');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'sent') {
    return (
      <div className="fade-up flex w-full max-w-[440px] flex-col gap-5">
        <div
          className="grid size-16 place-items-center rounded-full"
          style={{ background: 'var(--signal-soft)', color: 'var(--signal)' }}
          aria-hidden="true"
        >
          ✉
        </div>
        <Eyebrow>Check your inbox</Eyebrow>
        <h1
          className="serif text-[36px] tracking-tight"
          style={{ fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.02em' }}
        >
          Magic link on the way.
        </h1>
        <p className="text-[14px] text-[color:var(--ink-mute)]">
          We sent a one-tap sign-in link to{' '}
          <span className="mono text-[color:var(--ink)]">{email}</span>.
        </p>
        <Card className="p-3.5 text-[12px] text-[color:var(--ink-mute)]" style={{ maxWidth: 360 }}>
          Links expire in 15 minutes. Didn&apos;t see it? Check spam, or resend below.
        </Card>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setStep('method')}>
            Use a different email
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void submit(new Event('submit') as unknown as React.FormEvent)}
          >
            Resend
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up flex w-full max-w-[440px] flex-col gap-5">
      <Eyebrow>Sign in</Eyebrow>
      <h1
        className="serif text-[40px] tracking-tight"
        style={{ fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.025em' }}
      >
        Welcome back.
      </h1>
      <p className="text-[14px] text-[color:var(--ink-mute)]">Sign in to continue your venture.</p>

      <div className="flex gap-2">
        <a href={`${baseUrl}/v1/auth/google/start`} className="flex-1">
          <Button variant="secondary" type="button" className="w-full">
            Continue with Google
          </Button>
        </a>
        <Button variant="secondary" type="button" disabled className="flex-1">
          SSO
        </Button>
      </div>

      <div className="my-1 flex items-center gap-3">
        <span className="h-px flex-1 bg-[color:var(--line)]" />
        <Eyebrow>OR EMAIL</Eyebrow>
        <span className="h-px flex-1 bg-[color:var(--line)]" />
      </div>

      <form onSubmit={submit} className={cn('flex flex-col gap-4', err && 'shake')}>
        <Field label="Work email" htmlFor="signin-email" error={err || undefined}>
          <Input
            id="signin-email"
            type="email"
            required
            autoComplete="email"
            placeholder="ada@northwind.co"
            className="lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Card className="p-1">
          <div className="grid grid-cols-2 gap-1">
            {[
              { v: 'magic' as const, title: 'Magic link', sub: 'one-tap from your inbox' },
              { v: 'password' as const, title: 'Password', sub: 'classic + 2FA prompt' },
            ].map((m) => (
              <button
                key={m.v}
                type="button"
                onClick={() => setMode(m.v)}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-md border p-3 text-left transition-colors',
                  mode === m.v
                    ? 'border-[color:var(--line-2)] bg-[color:var(--paper-2)]'
                    : 'border-transparent hover:bg-[color:var(--paper-1)]',
                )}
                aria-pressed={mode === m.v}
              >
                <div className="text-[13px]" style={{ fontWeight: 500 }}>
                  {m.title}
                </div>
                <div className="text-[12px] text-[color:var(--ink-mute)]">{m.sub}</div>
              </button>
            ))}
          </div>
        </Card>

        <Button type="submit" variant="primary" size="lg" loading={submitting}>
          {mode === 'magic' ? 'Email me a link' : 'Continue'}
        </Button>
      </form>

      <div className="flex items-center justify-between text-[12px] text-[color:var(--ink-mute)]">
        <Link to="/help/contact" className="hover:text-[color:var(--ink)]">
          Forgot password?
        </Link>
        <Link to="/help/contact" className="hover:text-[color:var(--ink)]">
          Use a recovery code
        </Link>
      </div>

      <p className="mt-2 text-center text-[12px] text-[color:var(--ink-mute)]">
        New here?{' '}
        <Link to="/sign-up" className="underline">
          Create a workspace
        </Link>
      </p>
    </div>
  );
};
