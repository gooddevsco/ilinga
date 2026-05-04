import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn.js';

export const Card = ({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div className={cn('card', className)} {...rest}>
    {children}
  </div>
);

export const CardHeader = ({ children }: { children: ReactNode }): JSX.Element => (
  <div className="border-b border-[color:var(--line)] px-5 py-4 text-sm font-semibold text-[color:var(--ink)]">
    {children}
  </div>
);

export const CardBody = ({ children }: { children: ReactNode }): JSX.Element => (
  <div className="px-5 py-4 text-sm text-[color:var(--ink)]">{children}</div>
);
