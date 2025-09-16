import type { TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string; invalid?: boolean };

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return <textarea className={cn('textarea', className)} aria-invalid={invalid || undefined} {...props} />;
}
