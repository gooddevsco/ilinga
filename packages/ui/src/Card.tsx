import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn.js';

export const Card = ({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div
    className={cn(
      'rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] shadow-[var(--shadow-sm)]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);

export const CardHeader = ({ children }: { children: ReactNode }): JSX.Element => (
  <div className="border-b border-[color:var(--color-border)] px-5 py-4 text-sm font-semibold text-[color:var(--color-fg)]">
    {children}
  </div>
);

export const CardBody = ({ children }: { children: ReactNode }): JSX.Element => (
  <div className="px-5 py-4 text-sm text-[color:var(--color-fg)]">{children}</div>
);
