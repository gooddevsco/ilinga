import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn.js';

const fieldClass =
  'block w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm text-[color:var(--color-fg)] placeholder:text-[color:var(--color-fg-subtle)] focus:border-[color:var(--color-border-strong)]';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} className={cn(fieldClass, 'h-10', className)} {...rest} />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...rest }, ref) => (
    <textarea ref={ref} className={cn(fieldClass, 'min-h-[88px]', className)} {...rest} />
  ),
);
Textarea.displayName = 'Textarea';

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}
export const Field = ({ label, hint, error, htmlFor, children }: FieldProps): JSX.Element => (
  <div className="flex flex-col gap-1">
    <label htmlFor={htmlFor} className="text-sm font-medium text-[color:var(--color-fg)]">
      {label}
    </label>
    {children}
    {hint && !error && (
      <p className="text-xs text-[color:var(--color-fg-subtle)]">{hint}</p>
    )}
    {error && <p className="text-xs text-[color:var(--color-danger)]">{error}</p>}
  </div>
);
