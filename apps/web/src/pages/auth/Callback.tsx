import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

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
      <div className="mx-auto max-w-md py-16">
        <h1 className="text-2xl font-semibold">Sign-in failed</h1>
        <p className="mt-3 text-sm text-[color:var(--color-fg-muted)]">{error}</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-md py-16 text-sm text-[color:var(--color-fg-muted)]">
      Signing you in…
    </div>
  );
};

export const GoogleCallback = (): JSX.Element => {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    void refresh().then(() => navigate('/dashboard', { replace: true }));
  }, [refresh, navigate]);
  return (
    <div className="mx-auto max-w-md py-16 text-sm text-[color:var(--color-fg-muted)]">
      Finishing sign-in…
    </div>
  );
};
