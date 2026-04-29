import { useEffect, type ReactNode } from 'react';
import { cn } from './cn.js';

export interface SheetProps {
  open: boolean;
  onClose(): void;
  side?: 'left' | 'right';
  width?: number;
  children: ReactNode;
  ariaLabel: string;
}

export const Sheet = ({
  open,
  onClose,
  side = 'left',
  width = 280,
  children,
  ariaLabel,
}: SheetProps): JSX.Element | null => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={ariaLabel} className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={onClose} />
      <div
        className={cn(
          'absolute top-0 h-full bg-[color:var(--color-bg)] shadow-[var(--shadow-lg)]',
          side === 'left' ? 'left-0' : 'right-0',
        )}
        style={{ width }}
      >
        {children}
      </div>
    </div>
  );
};
