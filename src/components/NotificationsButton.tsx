"use client";
import { useRef, useState } from 'react';
import { useFocusTrap } from './useFocusTrap';
import { IconBell } from './icons';

export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useFocusTrap(open, ref, { onClose: () => setOpen(false) });
  return (
    <div className="menu">
      <button className="iconbtn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} title="Notifications">
        <IconBell />
      </button>
      {open && (
        <div ref={ref} className="menu-panel" role="menu">
          <div style={{ padding: 8 }} className="muted">No notifications</div>
        </div>
      )}
    </div>
  );
}

