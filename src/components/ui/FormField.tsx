import { cloneElement, isValidElement } from 'react';
import type { ReactElement } from 'react';

type FieldChild = ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>;

type Props = {
  id: string;
  label: string;
  help?: string;
  error?: string | null;
  required?: boolean;
  children: FieldChild;
};

// Minimal field wrapper that wires up label + help + error and ARIA attributes.
export function FormField({ id, label, help, error, required, children }: Props) {
  const helpId = help ? `${id}-help` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [helpId, errId].filter(Boolean).join(' ') || undefined;

  if (!isValidElement(children)) {
    throw new Error('FormField expects a single React element as child');
  }

  // Clone child to inject aria-describedby and invalid flag if supported.
  const child = cloneElement(children, {
    id,
    'aria-describedby': describedBy,
    ...(error ? { 'aria-invalid': true } : {}),
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
