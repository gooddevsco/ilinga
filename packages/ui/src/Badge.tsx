import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn.js';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export const Badge = ({
  tone = 'neutral',
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; children: ReactNode }): JSX.Element => {
  const toneClass: Record<BadgeTone, string> = {
    neutral: 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-fg)]',
    success: 'bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]',
    warning: 'bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]',
    danger: 'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]',
    info: 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-fg-muted)]',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        toneClass[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
};
