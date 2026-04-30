import { useEffect } from 'react';
import { api } from '../api';

/**
 * Heartbeats `presence.location` every 20s while the tab is foregrounded;
 * fires `presence.left` on unload so the dot disappears immediately for the
 * other clients on the cycle.
 */
export const usePresenceBeacon = (
  cycleId: string | undefined,
  location: string | undefined,
): void => {
  useEffect(() => {
    if (!cycleId) return;
    let cancelled = false;
    const heartbeat = async (): Promise<void> => {
      if (cancelled || document.hidden) return;
      try {
        await api.post(`/v1/cycles/${cycleId}/presence/beacon`, {
          intent: 'heartbeat',
          location,
        });
      } catch {
        /* swallow */
      }
    };
    void heartbeat();
    const id = setInterval(heartbeat, 20_000);
    const onUnload = (): void => {
      navigator.sendBeacon?.(
        `/v1/cycles/${cycleId}/presence/beacon`,
        new Blob([JSON.stringify({ intent: 'leave', location })], {
          type: 'application/json',
        }),
      );
    };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener('beforeunload', onUnload);
      void api
        .post(`/v1/cycles/${cycleId}/presence/beacon`, { intent: 'leave', location })
        .catch(() => undefined);
    };
  }, [cycleId, location]);
};
