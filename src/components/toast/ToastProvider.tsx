"use client";
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

export type Toast = { id: number; message: string; type?: 'default' | 'warn' | 'danger' };
type ToastCtx = { add: (message: string, type?: Toast['type']) => void };

const ToastContext = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: PropsWithChildren<{}>) {
  const [list, setList] = useState<Toast[]>([]);
  const add = useCallback((message: string, type: Toast['type'] = 'default') => {
    const id = Date.now() + Math.random();
    setList((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setList((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const value = useMemo(() => ({ add }), [add]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toaster" role="status" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} className={`toast ${t.type ?? ''}`.trim()}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

