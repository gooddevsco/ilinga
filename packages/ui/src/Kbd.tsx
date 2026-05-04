import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn.js';

/** Inline keyboard hint chip. Maps to `.kbd`. */
export const Kbd = ({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & { children: ReactNode }): JSX.Element => (
  <kbd className={cn('kbd', className)} {...rest}>
    {children}
  </kbd>
);
