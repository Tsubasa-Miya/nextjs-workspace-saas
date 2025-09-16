import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & { className?: string; invalid?: boolean };

export function Input({ className, invalid, ...props }: InputProps) {
  return <input className={cn('input', className)} aria-invalid={invalid || undefined} {...props} />;
}
