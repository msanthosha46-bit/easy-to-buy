import React, { useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
}

const OtpInput = ({ value, onChange, length = 4, disabled, error }: OtpInputProps) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (i: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[i] = digit;
    onChange(newDigits.join(''));
    if (digit && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[i] && i > 0) {
        refs.current[i - 1]?.focus();
        const newDigits = [...digits];
        newDigits[i - 1] = '';
        onChange(newDigits.join(''));
      } else {
        const newDigits = [...digits];
        newDigits[i] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, '').slice(0, length));
    const focusIdx = Math.min(pasted.length, length - 1);
    setTimeout(() => refs.current[focusIdx]?.focus(), 0);
  };

  return (
    <div className={cn('flex gap-3 justify-center', error && 'animate-shake')}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onClick={() => refs.current[i]?.select()}
          disabled={disabled}
          className={cn(
            'w-14 h-14 text-center text-2xl font-bold rounded-xl bg-input border-2 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-destructive focus:border-destructive focus:ring-destructive/30 text-destructive'
              : digits[i]
              ? 'border-primary text-primary'
              : 'border-border focus:border-primary'
          )}
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
