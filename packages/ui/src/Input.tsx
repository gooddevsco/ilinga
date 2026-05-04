import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn.js';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => <input ref={ref} className={cn('input', className)} {...rest} />,
);
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...rest }, ref) => (
  <textarea ref={ref} className={cn('textarea', className)} {...rest} />
));
Textarea.displayName = 'Textarea';

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}
export const Field = ({ label, hint, error, htmlFor, children }: FieldProps): JSX.Element => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={htmlFor} className="field-label">
      {label}
    </label>
    {children}
    {hint && !error && <p className="text-[12px] text-[color:var(--ink-mute)]">{hint}</p>}
    {error && <p className="text-[12px] text-[color:var(--danger)]">{error}</p>}
  </div>
);
