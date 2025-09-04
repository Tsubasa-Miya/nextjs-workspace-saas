"use client";
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Report to console for dev visibility
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Something went wrong</h2>
      {error?.message && (
        <p style={{ color: '#b91c1c', whiteSpace: 'pre-wrap' }}>{error.message}</p>
      )}
      <button onClick={() => reset()} style={{ padding: '6px 10px', marginTop: 12 }}>
        Try again
      </button>
    </div>
  );
}

