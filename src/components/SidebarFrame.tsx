"use client";
import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { SidebarContext } from './SidebarContext';
import { IconMenu, IconClose } from './icons';

export function SidebarFrame({ sidebar, children }: PropsWithChildren<{ sidebar: ReactNode }>) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <SidebarContext.Provider value={{ isOpen: open, close: () => setOpen(false) }}>
      <main className="container">
        <div className="page">
          <aside id="sidebar" className={open ? 'sidebar open' : 'sidebar'}>
            {sidebar}
          </aside>
          <div className="stack">
            <button
              className="btn sidebar-toggle"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="sidebar"
              aria-label={open ? 'Close menu' : 'Open menu'}
              title={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <IconClose /> : <IconMenu />}
              <span>Menu</span>
            </button>
            {children}
          </div>
        </div>
        {open && (
          <div className="sidebar-backdrop" onClick={() => setOpen(false)} aria-hidden />
        )}
      </main>
    </SidebarContext.Provider>
  );
}
