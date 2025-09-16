import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from './cn';

type Variant = 'default' | 'primary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

export type ButtonProps = PropsWithChildren<{
  variant?: Variant;
  className?: string;
  loading?: boolean;
  size?: Size;
}> & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = 'default', className, loading, disabled, size = 'md', children, ...props }: ButtonProps) {
  const base = 'btn';
  const v = variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : variant === 'danger' ? 'btn-danger' : '';
  const s = size === 'sm' ? 'btn-sm' : '';
  const isDisabled = disabled || loading;
  return (
    <button className={cn(base, v, s, className)} aria-busy={loading || undefined} disabled={isDisabled} {...props}>
      {loading && (
        <svg className="spinner" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )}
      <span>{children}</span>
    </button>
  );
}
