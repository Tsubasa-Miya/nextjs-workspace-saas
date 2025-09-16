/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { SidebarFrame } from '@/src/components/SidebarFrame';

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('UI/SidebarFrame (jsdom interactions)', () => {
  it('toggles open/close on button click, backdrop click, and Escape key', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(
      <SidebarFrame sidebar={<nav>Nav</nav>}>
        <section>Content</section>
      </SidebarFrame>
    );
    await tick();

    const aside = () => document.getElementById('sidebar')!;
    const toggle = () => document.querySelector('.sidebar-toggle') as HTMLButtonElement;

    // Initial: closed
    expect(aside().className).toBe('sidebar');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('.sidebar-backdrop')).toBeNull();

    // Click toggle → open
    toggle().click();
    await tick();
    expect(aside().className).toBe('sidebar open');
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('.sidebar-backdrop')).not.toBeNull();

    // Click backdrop → close
    (document.querySelector('.sidebar-backdrop') as HTMLElement).click();
    await tick();
    expect(aside().className).toBe('sidebar');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');

    // Open again, then press Escape to close
    toggle().click();
    await tick();
    expect(aside().className).toBe('sidebar open');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await tick();
    expect(aside().className).toBe('sidebar');

    root.unmount();
    host.remove();
  });
});

