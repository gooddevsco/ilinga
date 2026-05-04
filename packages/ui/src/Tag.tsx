import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn.js';

export type TagTone = 'neutral' | 'signal' | 'ochre' | 'indigo' | 'green' | 'danger';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
  /** Show a leading colored dot. */
  dot?: boolean;
  children: ReactNode;
}

/**
 * Mono-cased chip used everywhere in the design system. Tonal variants map to
 * the earth palette accents (signal=terracotta, ochre, indigo, green).
 */
export const Tag = ({
  tone = 'neutral',
  dot,
  className,
  children,
  ...rest
}: TagProps): JSX.Element => (
  <span className={cn('tag', tone !== 'neutral' && tone, className)} {...rest}>
    {dot && <span className="dot" aria-hidden="true" />}
    {children}
  </span>
);
