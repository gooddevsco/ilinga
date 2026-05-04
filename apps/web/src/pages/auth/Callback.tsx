import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Eyebrow } from '@ilinga/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const Status = ({
  eyebrow,
  title,
  body,
  spinner,
  children,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  spinner?: boolean;
  children?: React.ReactNode;
}): JSX.Element => (
  <div className="fade-up flex w-full max-w-[440px] flex-col gap-5">
    <Eyebrow>{eyebrow}</Eyebrow>
    <h1 className="serif text-[36px] tracking-tight" style={{ fontWeight: 500, lineHeight: 1.05 }}>
      {title}
    </h1>
    {spinner && (
      <div className="flex items-center gap-2 text-[13px] text-[color:var(--ink-mute)]">
        <span className="spinner" /> Signing you in…
      </div>
    )}
    {body && <p className="text-[14px] text-[color:var(--ink-mute)]">{body}</p>}
    {children}
  </div>
);

export const MagicCallback = (): JSX.Element => {
  const [params] = useSearchParams();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('Missing token');
      return;
    }
    void api
      .post('/v1/auth/magic-link/verify', { token })
      .then(async () => {
        await refresh();
        navigate('/dashboard', { replace: true });
      })
      .catch((err: { status?: number }) => {
        setError(
          err.status === 401
            ? 'That link is invalid or has expired. Please request a new one.'
            : 'Something went wrong. Please try again.',
        );
      });
  }, [params, navigate, refresh]);

  if (error) {
    return (
      <Status eyebrow="Sign-in failed" title="That didn't work." body={error}>
        <div className="flex gap-2">
          <Link to="/sign-in">
            <Button variant="primary" type="button">
              Try again
            </Button>
          </Link>
          <Link to="/help/contact">
            <Button variant="ghost" type="button">
              Contact support
            </Button>
          </Link>
        </div>
      </Status>
    );
  }

  return <Status eyebrow="Verifying" title="One moment…" spinner />;
};

export const GoogleCallback = (): JSX.Element => {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    void refresh().then(() => navigate('/dashboard', { replace: true }));
  }, [refresh, navigate]);
  return <Status eyebrow="Verifying" title="Finishing sign-in…" spinner />;
};
