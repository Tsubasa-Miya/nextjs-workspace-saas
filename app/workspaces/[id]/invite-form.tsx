/* istanbul ignore file */
"use client";
import { useState } from 'react';

export function InviteForm({ workspaceId }: { workspaceId: string }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Member' | 'Admin' | 'Owner'>('Member');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function shapeError(input: unknown, fallback = 'Failed to send invite') {
    const base = input as { error?: unknown; message?: unknown } | null;
    const err = base && (base.error ?? base.message);
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      const formErrors = Array.isArray((err as { formErrors?: unknown }).formErrors)
        ? ((err as { formErrors?: unknown[] }).formErrors as unknown[])
        : [];
      const fieldErrorsObj = (err as { fieldErrors?: unknown }).fieldErrors;
      const fieldErrors = fieldErrorsObj && typeof fieldErrorsObj === 'object'
        ? Object.values(fieldErrorsObj as Record<string, unknown>).flatMap((v) => (Array.isArray(v) ? v : []))
        : [];
      const combined = [...formErrors, ...fieldErrors].filter((v): v is string => typeof v === 'string');
      if (combined.length) return combined.join(', ');
    }
    return fallback;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) setMessage(shapeError(data));
      else {
        setMessage(res.status === 200 ? 'Invite resent (expiry extended)' : 'Invite sent');
        setEmail('');
        setRole('Member');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8 }} aria-live="polite">
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: 8 }} />
      <select value={role} onChange={(e) => setRole(e.target.value as 'Member' | 'Admin' | 'Owner')} style={{ padding: 8 }}>
        <option value="Member">Member</option>
        <option value="Admin">Admin</option>
      </select>
      <button type="submit" disabled={loading} style={{ padding: '6px 10px' }} aria-label="Send workspace invite">
        {loading ? 'Sending…' : 'Send invite'}
      </button>
      {message && <span role="status" aria-live="polite">{message}</span>}
    </form>
  );
}
