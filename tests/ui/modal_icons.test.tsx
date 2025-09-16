import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Modal } from '@/src/components/Modal';
import { IconMenu, IconClose, IconHome, IconNote, IconUsers, IconFile, IconBell, IconUser } from '@/src/components/icons';

describe('UI/Modal and Icons', () => {
  it('Modal returns null when closed, renders dialog when open', () => {
    const closed = renderToString(<Modal open={false} onClose={() => {}}>X</Modal>);
    expect(closed).toBe('');
    const open = renderToString(<Modal open onClose={() => {}} title="Hello"><button>OK</button></Modal>);
    expect(open).toContain('role="dialog"');
    expect(open).toContain('Hello');
  });

  it('Icons render basic SVG structure', () => {
    const icons = [IconMenu, IconClose, IconHome, IconNote, IconUsers, IconFile, IconBell, IconUser];
    for (const I of icons) {
      const html = renderToString(<I />);
      expect(html).toContain('<svg');
      expect(html).toContain('viewBox');
    }
  });
});

