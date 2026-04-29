import { useEffect, type ReactNode } from 'react';
import { cn } from './cn.js';

export interface ModalProps {
  open: boolean;
  onClose(): void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps): JSX.Element | null => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const sizeClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-3xl' : 'max-w-lg';
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-40 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative z-10 mx-4 w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] shadow-[var(--shadow-lg)]',
          sizeClass,
        )}
      >
        <header className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-3 text-sm font-semibold text-[color:var(--color-fg)]">
          <span>{title}</span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg)]"
          >
            ✕
          </button>
        </header>
        <div className="px-5 py-4 text-sm text-[color:var(--color-fg)]">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-[color:var(--color-border)] px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};
