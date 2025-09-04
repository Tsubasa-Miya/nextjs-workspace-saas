"use client";
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: 24 }}>
          <h2>App crashed</h2>
          {error?.message && (
            <p style={{ color: '#b91c1c', whiteSpace: 'pre-wrap' }}>{error.message}</p>
          )}
          <button onClick={() => reset()} style={{ padding: '6px 10px', marginTop: 12 }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}

