import type { HTMLAttributes, ReactNode } from 'react';
import { Tag, type TagTone } from './Tag.js';

/**
 * Legacy alias preserved so existing call sites keep compiling. The
 * tone-name mapping converts the cool-palette names (success/warning/info)
 * into the earth-palette tones (green/ochre/indigo) the design uses.
 */
export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const toneToTag: Record<BadgeTone, TagTone> = {
  neutral: 'neutral',
  success: 'green',
  warning: 'ochre',
  danger: 'danger',
  info: 'indigo',
};

export const Badge = ({
  tone = 'neutral',
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; children: ReactNode }): JSX.Element => (
  <Tag tone={toneToTag[tone]} className={className} {...rest}>
    {children}
  </Tag>
);
