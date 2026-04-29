import { useEffect } from 'react';

/**
 * Persists form state to sessionStorage on change; restored by the
 * caller via the returned `restore` value. Cleared by `clear()`.
 */
export const useFormPersist = <T,>(
  key: string,
  state: T,
): { restore: T | null; clear: () => void } => {
  useEffect(() => {
    try {
      window.sessionStorage.setItem(`il_form_${key}`, JSON.stringify(state));
    } catch {
      /* storage full / safari private mode */
    }
  }, [key, state]);

  let restore: T | null = null;
  try {
    const raw = window.sessionStorage.getItem(`il_form_${key}`);
    if (raw) restore = JSON.parse(raw) as T;
  } catch {
    /* ignore */
  }

  return {
    restore,
    clear: () => window.sessionStorage.removeItem(`il_form_${key}`),
  };
};
