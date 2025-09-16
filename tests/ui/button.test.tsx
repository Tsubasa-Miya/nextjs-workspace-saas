import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Button } from '@/src/components/ui/Button';

describe('UI/Button', () => {
  it('renders children and classes, default variant', () => {
    const html = renderToString(<Button className="extra">OK</Button>);
    expect(html).toContain('btn');
    expect(html).toContain('extra');
    expect(html).toContain('OK');
  });

  it('applies variant, size and loading/disabled state', () => {
    const html = renderToString(<Button variant="primary" size="sm" loading>Go</Button>);
    expect(html).toContain('btn-primary');
    expect(html).toContain('btn-sm');
    expect(html).toContain('aria-busy');
    // disabled attribute appears when loading
    expect(html).toContain('disabled');
  });
});
