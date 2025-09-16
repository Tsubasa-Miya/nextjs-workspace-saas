import type { PropsWithChildren, HTMLAttributes } from 'react';

export function HelpText({ id, children }: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  if (!children) return null;
  return <small id={id} className="muted">{children}</small>;
}
