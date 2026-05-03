import { useEffect, useState } from 'react';
import { api } from './api';
import { useTenant } from './tenant';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'paused'
  | 'cancelled'
  | 'unknown';

interface State {
  status: SubscriptionStatus;
  isReadOnly: boolean;
}

const READ_ONLY_STATES: SubscriptionStatus[] = ['unpaid', 'paused', 'cancelled'];

export const useSubscriptionStatus = (): State => {
  const { current } = useTenant();
  const [state, setState] = useState<State>({ status: 'unknown', isReadOnly: false });
  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    api
      .get<{ status: SubscriptionStatus }>(`/v1/billing/tenant/${current.id}/subscription`)
      .then((r) => {
        if (cancelled) return;
        setState({ status: r.status, isReadOnly: READ_ONLY_STATES.includes(r.status) });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [current]);
  return state;
};
