import { cn } from './cn.js';

export interface ToggleProps {
  checked: boolean;
  onChange(next: boolean): void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

/** Pill switch used in settings. Maps to the `.toggle` utility class. */
export const Toggle = ({
  checked,
  onChange,
  ariaLabel,
  disabled,
  className,
}: ToggleProps): JSX.Element => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn('toggle', className)}
  />
);
