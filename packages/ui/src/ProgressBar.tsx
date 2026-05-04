import { cn } from './cn.js';

export interface ProgressBarProps {
  /** 0-100 (clamped). */
  value: number;
  className?: string;
  ariaLabel?: string;
}

/** Slim bar progress indicator. Maps to the `.bar > i` pattern. */
export const ProgressBar = ({ value, className, ariaLabel }: ProgressBarProps): JSX.Element => {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('bar', className)}
    >
      <i style={{ width: `${pct}%` }} />
    </div>
  );
};
