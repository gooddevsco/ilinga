import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn.js';

/**
 * Mono-uppercase caption used everywhere as section header. Maps to the
 * `.eyebrow` utility class in the global stylesheet.
 */
export const Eyebrow = ({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }): JSX.Element => (
  <span className={cn('eyebrow', className)} {...rest}>
    {children}
  </span>
);
