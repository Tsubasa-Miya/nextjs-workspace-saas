import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';

export type FileInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  className?: string;
  onChange: (file: File | null) => void;
};

export function FileInput({ className, onChange, ...props }: FileInputProps) {
  return (
    <input
      type="file"
      className={cn('input', className)}
      onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      {...props}
    />
  );
}

