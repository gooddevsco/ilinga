import { useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './auth';

interface ActiveImpersonation {
  id: string;
  adminUserId: string;
  tenantId: string;
  reason: string;
  startedAt: string;
}

export const useImpersonation = (): ActiveImpersonation | null => {
  const { user } = useAuth();
  const [active, setActive] = useState<ActiveImpersonation | null>(null);
  useEffect(() => {
    if (!user) {
      setActive(null);
      return;
    }
    let cancelled = false;
    api
      .get<{ active: ActiveImpersonation | null }>('/v1/auth/impersonation')
      .then((r) => {
        if (!cancelled) setActive(r.active);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user]);
  return active;
};
