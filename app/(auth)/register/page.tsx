/* istanbul ignore file */
"use client";
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        let message = 'Failed to register';
        const base = (data && (data.error ?? data.message)) as unknown;
        if (typeof base === 'string') {
          message = base;
        } else if (base && typeof base === 'object') {
          const err = base as { formErrors?: unknown; fieldErrors?: unknown };
          const formErrors = Array.isArray(err.formErrors) ? (err.formErrors as unknown[]) : [];
          const fieldErrors = err.fieldErrors && typeof err.fieldErrors === 'object'
            ? Object.values(err.fieldErrors as Record<string, unknown>).flatMap((v) => (Array.isArray(v) ? v : []))
            : [];
          const combined = [...formErrors, ...fieldErrors].filter((v): v is string => typeof v === 'string');
          if (combined.length) message = combined.join(', ');
        }
        setError(message);
      } else {
        // Redirect to login page after successful registration
        router.push('/login');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Sign up</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={128} style={{ width: '100%', padding: 8 }} />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>{loading ? 'Creating…' : 'Create account'}</button>
        {error && <p role="alert" aria-live="assertive" style={{ color: 'crimson' }}>{error}</p>}
      </form>
    </main>
  );
}
