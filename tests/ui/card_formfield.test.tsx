import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Card } from '@/src/components/ui/Card';
import { FormField } from '@/src/components/ui/FormField';
import { Input } from '@/src/components/ui/Input';

describe('UI/Card and FormField', () => {
  it('Card wraps children and className', () => {
    const html = renderToString(<Card className="x"><span>Child</span></Card>);
    expect(html).toContain('card');
    expect(html).toContain('x');
    expect(html).toContain('Child');
  });

  it('FormField wires label/help/error and ARIA attributes', () => {
    const html = renderToString(
      <FormField id="f1" label="Label" help="Help" error="Err" required>
        <Input />
      </FormField>
    );
    expect(html).toContain('Label');
    expect(html).toContain('*');
    expect(html).toContain('Help');
    expect(html).toContain('Err');
    // aria-describedby should reference help and error ids
    expect(html).toContain('aria-describedby=');
    expect(html).toContain('f1-help');
    expect(html).toContain('f1-err');
  });
});
