import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FileInput } from '@/src/components/ui/FileInput';
import { Select } from '@/src/components/ui/Select';
import { Textarea } from '@/src/components/ui/Textarea';
import { Toolbar } from '@/src/components/ui/Toolbar';
import { HelpText } from '@/src/components/ui/HelpText';

describe('UI/more components', () => {
  it('FileInput renders and its onChange maps to first file or null', () => {
    const cb = vi.fn();
    const el: any = FileInput({ onChange: cb, className: 'f' } as any);
    expect(el.props.className).toContain('input');
    // Call handler with a fake File list
    el.props.onChange({ target: { files: [{ name: 'a' }] } });
    expect(cb).toHaveBeenCalledWith({ name: 'a' });
    el.props.onChange({ target: { files: undefined } });
    expect(cb).toHaveBeenCalledWith(null);
  });

  it('Select/Textarea/Toolbar/HelpText render with expected attributes', () => {
    const s = renderToString(<Select invalid><option>1</option></Select>);
    expect(s).toContain('select');
    expect(s).toContain('aria-invalid');
    const t = renderToString(<Textarea invalid defaultValue="x" />);
    expect(t).toContain('textarea');
    expect(t).toContain('aria-invalid');
    const tb = renderToString(<Toolbar className="wrap"><span>k</span></Toolbar>);
    expect(tb).toContain('toolbar');
    expect(tb).toContain('wrap');
    const h1 = renderToString(<HelpText id="h">H</HelpText>);
    expect(h1).toContain('small');
    const h2 = renderToString(<HelpText id="h2" /> as any);
    expect(h2).toBe('');
  });
});

