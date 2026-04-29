import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const POLICY_VERSION = '2026-04-29';
const STORAGE_KEY = 'il_consent';

export interface Consent {
  policyVersion: string;
  essential: true;
  analytics: boolean;
  recordedAt: string;
}

interface ConsentContextValue {
  consent: Consent | null;
  accept(analytics: boolean): void;
  open: boolean;
  setOpen(open: boolean): void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export const ConsentProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Consent;
      if (parsed.policyVersion === POLICY_VERSION) {
        setConsent(parsed);
        return;
      }
    }
    setOpen(true);
  }, []);

  const accept = (analytics: boolean): void => {
    const next: Consent = {
      policyVersion: POLICY_VERSION,
      essential: true,
      analytics,
      recordedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setConsent(next);
    setOpen(false);
  };

  return (
    <ConsentContext.Provider value={{ consent, accept, open, setOpen }}>
      {children}
      {open && <CookieBanner accept={accept} />}
    </ConsentContext.Provider>
  );
};

export const useConsent = (): ConsentContextValue => {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent outside ConsentProvider');
  return ctx;
};

const CookieBanner = ({
  accept,
}: {
  accept: (analytics: boolean) => void;
}): JSX.Element => (
  <div
    role="dialog"
    aria-label="Cookie preferences"
    className="fixed inset-x-0 bottom-0 z-50 mx-auto mb-4 w-[min(720px,calc(100%-2rem))] rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-4 shadow-[var(--shadow-lg)]"
  >
    <p className="text-sm text-[color:var(--color-fg)]">
      We use strictly-necessary cookies to keep you signed in. With your consent we also use
      privacy-respecting analytics (PostHog, EU-hosted) to improve the product.
    </p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => accept(true)}
        className="inline-flex h-9 items-center rounded-md bg-[color:var(--color-accent)] px-4 text-sm font-medium text-[color:var(--color-accent-fg)]"
      >
        Accept all
      </button>
      <button
        type="button"
        onClick={() => accept(false)}
        className="inline-flex h-9 items-center rounded-md border border-[color:var(--color-border)] px-4 text-sm font-medium text-[color:var(--color-fg)]"
      >
        Essential only
      </button>
      <a
        href="/legal/cookies"
        className="ml-auto self-center text-sm text-[color:var(--color-fg-muted)] underline"
      >
        Read more
      </a>
    </div>
  </div>
);
