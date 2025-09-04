/* istanbul ignore file */
"use client";
import { useEffect, useMemo, useState } from 'react';

export default function ResetPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const t = url.searchParams.get('token');
    setToken(t);
  }, []);

  const disabled = useMemo(() => {
    return !token || !password || password !== confirm || submitting;
  }, [token, password, confirm, submitting]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error ?? 'Failed to reset password');
      } else {
        setMessage('Password updated. You may now log in.');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Reset Password</h1>
      {!token ? (
        <p>Invalid or missing token.</p>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
          <div>
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              maxLength={128}
              required
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div>
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              maxLength={128}
              required
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <button type="submit" disabled={disabled} style={{ padding: '8px 12px' }}>
            {submitting ? 'Submitting…' : 'Reset password'}
          </button>
          {message && <p>{message}</p>}
        </form>
      )}
    </main>
  );
}
