"use client";
import { useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useFocusTrap } from './useFocusTrap';
import { IconUser } from './icons';

export function UserMenu({ name, email }: { name?: string | null; email?: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useFocusTrap(open, ref, { onClose: () => setOpen(false) });
  return (
    <div className="menu">
      <button className="iconbtn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} title="Account">
        <IconUser />
        <span className="muted" style={{ display: 'none' }} aria-hidden>{name || email || 'Account'}</span>
      </button>
      {open && (
        <div ref={ref} className="menu-panel" role="menu">
          <div style={{ padding: '8px 10px' }}>
            <div style={{ fontWeight: 600 }}>{name || email || 'Account'}</div>
            {email && name && <div className="muted" style={{ fontSize: 12 }}>{email}</div>}
          </div>
          <div className="menu-sep" />
          <button className="menu-item" onClick={() => { setOpen(false); window.location.href = '/dashboard'; }}>Dashboard</button>
          <button className="menu-item" onClick={() => { setOpen(false); signOut(); }}>Sign out</button>
        </div>
      )}
    </div>
  );
}

