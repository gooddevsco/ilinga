import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from './api';
import { useAuth } from './auth';

export interface TenantSummary {
  id: string;
  slug: string;
  displayName: string;
  role: string;
}

interface TenantContextValue {
  tenants: TenantSummary[];
  current: TenantSummary | null;
  setCurrent(t: TenantSummary): void;
  refresh(): Promise<void>;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);
const STORAGE_KEY = 'il_current_tenant';

export const TenantProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [current, setCurrentState] = useState<TenantSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setTenants([]);
      setCurrentState(null);
      return;
    }
    setLoading(true);
    try {
      const r = await api.get<{ tenants: TenantSummary[] }>('/v1/tenants');
      setTenants(r.tenants);
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const found = r.tenants.find((t) => t.id === stored) ?? r.tenants[0] ?? null;
      setCurrentState(found);
      if (found) window.localStorage.setItem(STORAGE_KEY, found.id);
    } catch {
      // surface via toast in caller; keep silent here
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setCurrent = useCallback((t: TenantSummary): void => {
    setCurrentState(t);
    window.localStorage.setItem(STORAGE_KEY, t.id);
  }, []);

  const value = useMemo(
    () => ({ tenants, current, setCurrent, refresh, loading }),
    [tenants, current, setCurrent, refresh, loading],
  );
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = (): TenantContextValue => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant outside TenantProvider');
  return ctx;
};
