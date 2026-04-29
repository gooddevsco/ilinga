import type { ReactNode } from 'react';
import { cn } from './cn.js';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body?: ReactNode;
  cta?: ReactNode;
  className?: string;
  testId?: string;
}

export const EmptyState = ({
  icon,
  title,
  body,
  cta,
  className,
  testId,
}: EmptyStateProps): JSX.Element => (
  <div
    data-testid={testId ?? 'empty-state'}
    className={cn(
      'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-6 py-16 text-center',
      className,
    )}
  >
    {icon && <div className="size-10 text-[color:var(--color-fg-subtle)]">{icon}</div>}
    <h3 className="text-lg font-semibold text-[color:var(--color-fg)]">{title}</h3>
    {body && (
      <p className="max-w-md text-sm text-[color:var(--color-fg-muted)]">{body}</p>
    )}
    {cta && <div className="mt-2">{cta}</div>}
  </div>
);
