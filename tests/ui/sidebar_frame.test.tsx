import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SidebarFrame } from '@/src/components/SidebarFrame';

describe('UI/SidebarFrame (SSR basics)', () => {
  it('renders container, sidebar and toggle button with ARIA attrs', () => {
    const html = renderToString(
      <SidebarFrame sidebar={<nav>Nav</nav>}>
        <section>Content</section>
      </SidebarFrame>
    );
    expect(html).toContain('class="container"');
    expect(html).toContain('id="sidebar"');
    expect(html).toContain('class="btn sidebar-toggle"');
    expect(html).toContain('aria-controls="sidebar"');
    expect(html).toContain('Menu');
    // initial state is closed → no \'open\' class on sidebar
    expect(html).not.toContain('sidebar open');
  });
});

