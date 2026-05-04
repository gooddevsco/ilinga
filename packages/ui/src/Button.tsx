import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from './cn.js';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual treatment.
   * - primary  → ink-on-paper, the default CTA (matches `.btn.primary`)
   * - signal   → terracotta accent, for the highest-emphasis action
   * - secondary → bare hairline pill (matches `.btn` baseline)
   * - ghost    → transparent until hover
   * - danger   → red, for destructive flows
   */
  variant?: 'primary' | 'signal' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'btn primary',
  signal: 'btn signal',
  secondary: 'btn',
  ghost: 'btn ghost',
  danger: 'btn danger',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'sm',
  md: '',
  lg: 'lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...rest }, ref) => (
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      aria-busy={loading || undefined}
      disabled={disabled ?? loading}
      className={cn(variantClass[variant], sizeClass[size], className)}
      {...rest}
    >
      {loading && <span aria-hidden="true" className="spinner" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
