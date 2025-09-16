"use client";
import type { PropsWithChildren } from 'react';
import { ToastProvider } from './toast/ToastProvider';
import { useEffect } from 'react';
import { useToast } from './toast/ToastProvider';
import { setUnauthorizedHandler, setRequestLogger } from '@/src/lib/api';
import { getMetricsSnapshot, onMetrics, importMetricsJSON, exportMetricsJSON } from '@/src/lib/apiMetrics';
import { useRouter } from 'next/navigation';
import ApiOverlay from '@/src/components/debug/ApiOverlay';

export default function Providers({ children }: PropsWithChildren<{}>) {
  return (
    <ToastProvider>
      <UnauthorizedHook />
      {process.env.NEXT_PUBLIC_API_OVERLAY === '1' && <ApiOverlay />}
      {children}
    </ToastProvider>
  );
}

function UnauthorizedHook() {
  const toast = useToast();
  const router = useRouter();
  useEffect(() => {
    setUnauthorizedHandler((status) => {
      toast.add('Session expired. Please sign in.', 'danger');
      router.push('/login');
    });
    const enableApiLog = process.env.NEXT_PUBLIC_API_LOG === '1' || process.env.NODE_ENV === 'development';
    let offMetrics: (() => void) | null = null;
    if (enableApiLog) {
      setRequestLogger((log) => {
        // eslint-disable-next-line no-console
        console.debug(`[api] ${log.method || 'GET'} ${log.url} -> ${log.status} (${log.durationMs}ms)`);
      });
      // Restore persisted metrics if exists
      try {
        const persisted = typeof window !== 'undefined' ? localStorage.getItem('apiMetrics') : null;
        if (persisted) importMetricsJSON(persisted);
      } catch {}
      offMetrics = onMetrics(() => {
        const snap = getMetricsSnapshot();
        // eslint-disable-next-line no-console
        console.debug(`[api:sum] total=${snap.total} success=${snap.success} error=${snap.error} avg=${snap.avgMs}ms`);
        if (typeof window !== 'undefined') (window as any).__apiMetrics = snap;
        // Persist snapshot to localStorage for later sessions
        try {
          localStorage.setItem('apiMetrics', exportMetricsJSON());
        } catch {}
      });
    }
    return () => {
      setUnauthorizedHandler(null);
      setRequestLogger(null);
      if (offMetrics) offMetrics();
    };
  }, [router, toast]);
  return null;
}
