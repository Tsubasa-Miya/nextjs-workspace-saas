import type { ReactElement } from 'react';

type Props = {
  id: string;
  label: string;
  help?: string;
  error?: string | null;
  required?: boolean;
  children: ReactElement;
};

// Minimal field wrapper that wires up label + help + error and ARIA attributes.
export function FormField({ id, label, help, error, required, children }: Props) {
  const helpId = help ? `${id}-help` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [helpId, errId].filter(Boolean).join(' ') || undefined;

  // Clone child to inject aria-describedby and invalid flag if supported.
  const child = cloneWithProps(children as any, {
    id,
    'aria-describedby': describedBy,
    ...(error ? { invalid: true } : {}),
  });

  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </label>
      {child}
      {help && (
        <small id={helpId} className="muted">
          {help}
        </small>
      )}
      {error && (
        <p id={errId} role="alert" aria-live="assertive" className="error">
          {error}
        </p>
      )}
    </div>
  );
}

function cloneWithProps<T extends object>(element: ReactElement, props: T): ReactElement {
  const React = require('react');
  return React.cloneElement(element, props);
}

