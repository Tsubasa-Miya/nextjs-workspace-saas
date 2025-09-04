"use client";
import type { PropsWithChildren } from 'react';
import { useRef } from 'react';
import { useFocusTrap } from './useFocusTrap';

export function Modal({ open, onClose, title, children, width = 640 }: PropsWithChildren<{ open: boolean; onClose: () => void; title?: string; width?: number }>) {
  const ref = useRef<HTMLDivElement | null>(null);
  useFocusTrap(open, ref, { onClose });
  if (!open) return null;
  const labelledBy = title ? 'modal-title' : undefined;
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 1000 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        ref={ref}
        style={{ background: '#fff', padding: 16, borderRadius: 8, width: `min(${width}px, 95vw)` }}
      >
        {title && <h3 id={labelledBy} style={{ marginTop: 0 }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}
