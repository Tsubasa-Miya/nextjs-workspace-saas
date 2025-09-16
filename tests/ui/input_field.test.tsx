import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Input } from '@/src/components/ui/Input';
import { FieldError } from '@/src/components/ui/FieldError';

describe('UI/Input and FieldError', () => {
  it('renders input with aria-invalid when invalid', () => {
    const html = renderToString(<Input invalid placeholder="X" />);
    expect(html).toContain('input');
    expect(html).toContain('aria-invalid');
  });

  it('FieldError returns null when no children, renders with attributes when has children', () => {
    const empty = renderToString(<FieldError id="e1" /> as any);
    expect(empty).toBe('');
    const withText = renderToString(<FieldError id="e2">Err</FieldError>);
    expect(withText).toContain('role="alert"');
    expect(withText).toContain('e2');
    expect(withText).toContain('Err');
  });
});
