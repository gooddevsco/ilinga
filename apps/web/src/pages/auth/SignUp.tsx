import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Eyebrow, Field, Input, Tag, useToast, cn } from '@ilinga/ui';
import { api, baseUrl } from '../../lib/api';

const roles = ['Founder', 'Operator', 'Consultant', 'PM', 'Investor'] as const;
type Role = (typeof roles)[number];

type Step = 'account' | 'sent';

export const SignUp = (): JSX.Element => {
  const [step, setStep] = useState<Step>('account');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Founder');
  const [accept, setAccept] = useState(false);
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr('Use your work email.');
      return;
    }
    if (!accept) {
      toast.push({
        variant: 'warning',
        title: 'Please accept the terms',
        body: 'You need to accept the terms and privacy policy to continue.',
      });
      return;
    }
    setErr('');
    setSubmitting(true);
    try {
      await api.post('/v1/auth/magic-link/request', {
        email,
        purpose: 'signup',
        metadata: { name, role },
      });
    } finally {
      setStep('sent');
      setSubmitting(false);
    }
  };

  if (step === 'sent') {
    return (
      <div className="fade-up flex w-full max-w-[440px] flex-col gap-5">
        <Eyebrow>Confirm your email</Eyebrow>
        <h1
          className="serif text-[36px] tracking-tight"
          style={{ fontWeight: 500, lineHeight: 1.05 }}
        >
          Almost there.
        </h1>
        <p className="text-[14px] text-[color:var(--ink-mute)]">
          We sent a confirmation link to{' '}
          <span className="mono text-[color:var(--ink)]">{email}</span>. Click it within 15 minutes
          to finish creating your account and workspace.
        </p>
        <Card className="p-4 text-[13px] text-[color:var(--ink-mute)]">
          <div className="mb-2 flex items-center gap-2">
            <Tag tone="signal" dot>
              50 free credits
            </Tag>
          </div>
          We&apos;ll add 50 credits to your first workspace once you confirm — enough to run your
          first Snapshot report end-to-end.
        </Card>
        <Button type="button" variant="secondary" onClick={() => setStep('account')}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="fade-up flex w-full max-w-[460px] flex-col gap-5">
      <Eyebrow>Step 1 / 3 · Account</Eyebrow>
      <h1
        className="serif text-[40px] tracking-tight"
        style={{ fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.02em' }}
      >
        Create your account.
      </h1>
      <p className="text-[14px] text-[color:var(--ink-mute)]">
        50 credits free. No card. Single sign-on if you&apos;d rather skip the typing.
      </p>

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
        <Field label="Full name" htmlFor="signup-name">
          <Input
            id="signup-name"
            type="text"
            required
            autoComplete="name"
            placeholder="Ada Okonkwo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Work email" htmlFor="signup-email" error={err || undefined}>
          <Input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            placeholder="ada@northwind.co"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <div>
          <span className="field-label">You are a</span>
          <div
            className="r-nav-row mt-1.5 flex flex-wrap gap-1.5"
            role="radiogroup"
            aria-label="Role"
          >
            {roles.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={role === r}
                onClick={() => setRole(r)}
                className={cn(
                  'btn sm',
                  role === r &&
                    'border-[color:var(--signal)] bg-[color:var(--signal-soft)] text-[color:var(--signal)]',
                )}
                style={
                  role === r
                    ? { borderColor: 'var(--signal)', background: 'var(--signal-soft)' }
                    : undefined
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-2 text-[12px] text-[color:var(--ink-mute)]">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-0.5"
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

        <Button type="submit" variant="primary" size="lg" loading={submitting}>
          Create account
        </Button>
      </form>

      <p className="mt-2 text-center text-[12px] text-[color:var(--ink-mute)]">
        Already have an account?{' '}
        <Link to="/sign-in" className="underline">
          Sign in
        </Link>
      </p>
    </div>
  );
};
