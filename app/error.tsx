"use client";
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Report to console for dev visibility
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="container">
      <div className="stack" style={{ maxWidth: 560 }}>
        <h2>Something went wrong</h2>
        {error?.message && (
          <p style={{ color: 'var(--danger)', whiteSpace: 'pre-wrap' }}>{error.message}</p>
        )}
        <button className="btn" onClick={() => reset()} style={{ marginTop: 12 }}>
          Try again
        </button>
      </div>
    </div>
  );
}
/* istanbul ignore file */
