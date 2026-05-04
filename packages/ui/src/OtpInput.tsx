import { useEffect, useRef } from 'react';
import { cn } from './cn.js';

export interface OtpInputProps {
  /** Number of cells (default 6). */
  length?: number;
  value: string;
  onChange(next: string): void;
  /** Fires when the user completes the last cell. */
  onComplete?(value: string): void;
  ariaLabel?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

const DIGIT = /^\d$/;

/**
 * Six-cell OTP input with paste-to-fill, backspace-walks-back behaviour, and
 * arrow-key navigation. Each cell maps to the global `.otp-cell` utility.
 */
export const OtpInput = ({
  length = 6,
  value,
  onChange,
  onComplete,
  ariaLabel = 'One-time code',
  autoFocus,
  disabled,
}: OtpInputProps): JSX.Element => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && refs.current[0]) refs.current[0].focus();
  }, [autoFocus]);

  const setAt = (i: number, ch: string): void => {
    const arr = value.padEnd(length, ' ').split('');
    arr[i] = ch;
    const next = arr.join('').replace(/ /g, '').slice(0, length);
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  return (
    <div className="flex gap-2" role="group" aria-label={ariaLabel}>
      {Array.from({ length }).map((_, i) => {
        const ch = value[i] ?? '';
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            value={ch}
            aria-label={`Digit ${i + 1}`}
            className={cn('otp-cell', ch && 'filled')}
            onChange={(e) => {
              const v = e.target.value.slice(-1);
              if (!v) {
                setAt(i, '');
                return;
              }
              if (!DIGIT.test(v)) return;
              setAt(i, v);
              const nextEl = refs.current[i + 1];
              if (nextEl) nextEl.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !ch && i > 0) {
                refs.current[i - 1]?.focus();
              } else if (e.key === 'ArrowLeft' && i > 0) {
                refs.current[i - 1]?.focus();
              } else if (e.key === 'ArrowRight' && i < length - 1) {
                refs.current[i + 1]?.focus();
              }
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
              if (!pasted) return;
              e.preventDefault();
              const next = (value.slice(0, i) + pasted).slice(0, length);
              onChange(next);
              const focusIdx = Math.min(next.length, length - 1);
              refs.current[focusIdx]?.focus();
              if (next.length === length) onComplete?.(next);
            }}
          />
        );
      })}
    </div>
  );
};
