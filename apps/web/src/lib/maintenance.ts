import { useEffect, useState } from 'react';
import { api } from './api';

interface MaintenanceState {
  active: boolean;
  message: string;
}

export const useMaintenance = (): MaintenanceState => {
  const [state, setState] = useState<MaintenanceState>({ active: false, message: '' });
  useEffect(() => {
    let cancelled = false;
    const fetchOne = () =>
      api
        .get<MaintenanceState>('/v1/internal/maintenance')
        .then((r) => {
          if (!cancelled) setState(r);
        })
        .catch(() => undefined);
    void fetchOne();
    const id = setInterval(fetchOne, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
  return state;
};
