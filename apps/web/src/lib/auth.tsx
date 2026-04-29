import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type ApiError } from './api';

interface AuthUser {
  userId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh(): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api.get<{ userId: string; expiresAt: string }>('/v1/auth/me');
      setUser({ userId: me.userId });
    } catch (err) {
      if ((err as ApiError).status === 401) {
        setUser(null);
      } else {
        // network down — keep last known state, surface in shell
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await api.post('/v1/auth/sign-out').catch(() => undefined);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
};
