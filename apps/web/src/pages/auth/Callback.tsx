import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useTenant } from '../../lib/tenant';

interface VerifyResult {
  ok: boolean;
  purpose: string;
  invitedTenantId: string | null;
  invitedRole: string | null;
}

export const MagicCallback = (): JSX.Element => {
  const [params] = useSearchParams();
  const { refresh: refreshAuth } = useAuth();
  const { refresh: refreshTenants } = useTenant();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('Missing token');
      return;
    }
    void api
      .post<VerifyResult>('/v1/auth/magic-link/verify', { token })
      .then(async (verify) => {
        await refreshAuth();
        await refreshTenants();
        if (verify.purpose === 'tenant_invite' && verify.invitedTenantId) {
          // Land directly on the dashboard of the workspace they were
          // invited into.
          navigate('/dashboard', { replace: true });
        } else if (verify.purpose === 'signup') {
          navigate('/onboarding/create-workspace', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      })
      .catch((err: { status?: number }) => {
        setError(
          err.status === 401
            ? 'That link is invalid or has expired. Please request a new one.'
            : 'Something went wrong. Please try again.',
        );
      });
  }, [params, navigate, refreshAuth, refreshTenants]);

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
  const { refresh: refreshAuth } = useAuth();
  const { refresh: refreshTenants } = useTenant();
  const navigate = useNavigate();
  useEffect(() => {
    void Promise.all([refreshAuth(), refreshTenants()]).then(() =>
      navigate('/dashboard', { replace: true }),
    );
  }, [refreshAuth, refreshTenants, navigate]);
  return (
    <div className="mx-auto max-w-md py-16 text-sm text-[color:var(--color-fg-muted)]">
      Finishing sign-in…
    </div>
  );
};
