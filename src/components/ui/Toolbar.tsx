import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from './cn';

export type ToolbarProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function Toolbar({ className, children, ...props }: ToolbarProps) {
  return (
    <div className={cn('toolbar', className)} {...props}>
      {children}
    </div>
  );
}

