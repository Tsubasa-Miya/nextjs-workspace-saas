import type { PropsWithChildren, HTMLAttributes } from 'react';

export function FieldError({ id, children }: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  if (!children) return null;
  return (
    <p id={id} role="alert" aria-live="assertive" className="error">{children}</p>
  );
}
