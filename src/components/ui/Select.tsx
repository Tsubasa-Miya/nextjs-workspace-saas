import type { SelectHTMLAttributes } from 'react';
import { cn } from './cn';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { className?: string; invalid?: boolean };

export function Select({ className, children, invalid, ...props }: SelectProps) {
  return (
    <select className={cn('select', className)} aria-invalid={invalid || undefined} {...props}>
      {children}
    </select>
  );
}
