import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cn } from './cn.js';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';
export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  body?: string;
  durationMs?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  push(t: Omit<Toast, 'id'>): string;
  dismiss(id: string): void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;
const newId = (): string => `toast_${++counter}_${Date.now().toString(36)}`;

export const ToastProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = newId();
      setToasts((prev) => [...prev, { ...t, id }]);
      return id;
    },
    [],
  );
  const value = useMemo<ToastContextValue>(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast outside ToastProvider');
  return ctx;
};

const variantClass: Record<ToastVariant, string> = {
  info: 'border-[color:var(--color-border)] bg-[color:var(--color-bg)]',
  success: 'border-[color:var(--color-success)] bg-[color:var(--color-bg)]',
  warning: 'border-[color:var(--color-warning)] bg-[color:var(--color-bg)]',
  error: 'border-[color:var(--color-danger)] bg-[color:var(--color-bg)]',
};

const Toaster = ({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss(id: string): void;
}): JSX.Element => (
  <div
    role="region"
    aria-label="Notifications"
    className="pointer-events-none fixed inset-x-0 bottom-4 z-50 mx-auto flex max-w-md flex-col gap-2 px-4"
  >
    {toasts.map((t) => (
      <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
    ))}
  </div>
);

const ToastItem = ({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss(): void;
}): JSX.Element => {
  useEffect(() => {
    const ms = toast.durationMs ?? 6000;
    const id = setTimeout(onDismiss, ms);
    return () => clearTimeout(id);
  }, [toast, onDismiss]);
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto rounded-md border px-4 py-3 shadow-md',
        variantClass[toast.variant],
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-[color:var(--color-fg)]">{toast.title}</p>
          {toast.body && (
            <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">{toast.body}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-sm text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg)]"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
