/* istanbul ignore file */
"use client";
import { useMemo, useRef, useState } from 'react';
import { useFocusTrap } from '@/src/components/useFocusTrap';

type Invite = { id: string; email: string; role: 'Owner' | 'Admin' | 'Member'; expiresAt: string; token: string; createdAt?: string };

const EXP_SOON_HOURS: number = Number(process.env.NEXT_PUBLIC_INVITE_EXP_SOON_HOURS ?? '48') || 48;

export function PendingInvitesClient({ workspaceId, invites: initialInvites }: { workspaceId: string; invites: Invite[] }) {
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'All' | 'Owner' | 'Admin' | 'Member'>('All');
  const [message, setMessage] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'CreatedDesc' | 'ExpiresAsc' | 'EmailAsc'>('CreatedDesc');
  const [confirm, setConfirm] = useState<Invite | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useFocusTrap(!!confirm, dialogRef, { onClose: () => setConfirm(null) });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return invites.filter((i) => {
      const matchText = !t || i.email.toLowerCase().includes(t);
      const matchRole = role === 'All' || i.role === role;
      return matchText && matchRole;
    });
  }, [q, role, invites]);

  const displayed = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortBy === 'ExpiresAsc') {
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      }
      if (sortBy === 'EmailAsc') {
        return a.email.localeCompare(b.email);
      }
      // CreatedDesc default
      const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return cb - ca;
    });
    return arr;
  }, [filtered, sortBy]);

  function isExpired(i: Invite) {
    return new Date(i.expiresAt).getTime() < Date.now();
  }

  function isExpiringSoon(i: Invite) {
    const now = Date.now();
    const exp = new Date(i.expiresAt).getTime();
    const windowMs = EXP_SOON_HOURS * 60 * 60 * 1000; // configurable hours
    return exp >= now && exp <= now + windowMs;
  }

  function shapeError(input: unknown, fallback = 'Operation failed') {
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

  type ApiInvite = { id: unknown; email: unknown; role: unknown; expiresAt: unknown; token: unknown; createdAt?: unknown };
  function toInvite(item: ApiInvite): Invite | null {
    const id = typeof item.id === 'string' ? item.id : null;
    const email = typeof item.email === 'string' ? item.email : null;
    const role = item.role;
    const roleOk = role === 'Owner' || role === 'Admin' || role === 'Member';
    const expiresAt = typeof item.expiresAt === 'string' ? item.expiresAt : null;
    const token = typeof item.token === 'string' ? item.token : null;
    const createdAt = typeof item.createdAt === 'string' || typeof item.createdAt === 'undefined' ? (item.createdAt as string | undefined) : undefined;
    if (id && email && roleOk && expiresAt && token) return { id, email, role, expiresAt, token, createdAt } as Invite;
    return null;
  }

  async function loadInvites() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`);
      if (!res.ok) return; // keep current state if failed
      const list = (await res.json()) as unknown;
      if (Array.isArray(list)) {
        const mapped = list.map((i) => toInvite(i as ApiInvite)).filter((v): v is Invite => v !== null);
        setInvites(mapped);
      }
    } catch (_) {
      // ignore
    }
  }

  async function resend(i: Invite) {
    setMessage(null);
    setLoadingId(i.id);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: i.email, role: i.role }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 200) {
        setMessage(shapeError(data));
      } else {
        setMessage(res.status === 200 ? 'Invite resent (expiry extended)' : 'Invite sent');
        // If API returned new expiry, update the row without refetch; otherwise fallback to loading.
        if (data && data.expiresAt) {
          setInvites((prev) => prev.map((x) => (x.id === i.id ? { ...x, expiresAt: data.expiresAt } : x)));
        } else {
          await loadInvites();
        }
      }
    } catch (e) {
      setMessage('Network error');
    } finally {
      setLoadingId(null);
    }
  }

  async function doCancel(i: Invite) {
    setMessage(null);
    setLoadingId(i.id);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites?id=${encodeURIComponent(i.id)}`, { method: 'DELETE' });
      const data = res.ok ? null : await res.json();
      if (!res.ok) {
        setMessage(shapeError(data));
      } else {
        setInvites(invites.filter((x) => x.id !== i.id));
        setMessage('Invite canceled');
        await loadInvites();
      }
    } catch (e) {
      setMessage('Network error');
    } finally {
      setLoadingId(null);
    }
  }

  async function copy(i: Invite) {
    setMessage(null);
    const acceptUrl = `${window.location.origin}/invites/${i.token}`;
    try {
      await navigator.clipboard.writeText(acceptUrl);
      setMessage('Link copied');
    } catch (_) {
      // Fallback: prompt
      const ok = window.prompt('Copy invite URL', acceptUrl);
      if (ok !== null) setMessage('Link copied');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by email"
          aria-label="Filter invites"
          style={{ padding: 8, maxWidth: 320, width: '100%' }}
        />
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as 'All' | 'Owner' | 'Admin' | 'Member')} style={{ marginLeft: 6, padding: 8 }} aria-label="Filter invites by role">
            <option value="All">All</option>
            <option value="Owner">Owner</option>
            <option value="Admin">Admin</option>
            <option value="Member">Member</option>
          </select>
        </label>
        <label>
          Sort
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'CreatedDesc' | 'ExpiresAsc' | 'EmailAsc')} style={{ marginLeft: 6, padding: 8 }} aria-label="Sort invites">
            <option value="CreatedDesc">Newest</option>
            <option value="ExpiresAsc">Expires soon</option>
            <option value="EmailAsc">Email</option>
          </select>
        </label>
        {message && <span role="status" aria-live="polite" style={{ marginLeft: 'auto' }}>{message}</span>}
      </div>
      <ul>
        {displayed.map((i) => {
          const expired = isExpired(i);
          const soon = !expired && isExpiringSoon(i);
          return (
          <li key={i.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', border: `1px solid ${expired ? '#fca5a5' : soon ? '#fcd34d' : 'transparent'}`, padding: 8, borderRadius: 6, background: expired ? '#fff1f2' : soon ? '#fffbeb' : undefined }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{i.email} <small>({i.role})</small></span>
              {expired && (
                <span aria-label="Expired" title="Expired" style={{ background: '#ef4444', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 12 }}>Expired</span>
              )}
              {soon && (
                <span aria-label="Expiring soon" title="Expiring soon" style={{ background: '#f59e0b', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 12 }}>Expiring soon</span>
              )}
            </span>
            <small style={{ color: '#666' }}>expires {new Date(i.expiresAt).toLocaleString()}</small>
            <button onClick={() => copy(i)} style={{ padding: '4px 8px' }} aria-label={`Copy invite link for ${i.email}`}>
              Copy link
            </button>
            <button onClick={() => resend(i)} disabled={loadingId === i.id} style={{ padding: '4px 8px' }} aria-label={`Resend invite to ${i.email}`}>
              {loadingId === i.id ? 'Working…' : 'Resend'}
            </button>
            <button onClick={() => setConfirm(i)} disabled={loadingId === i.id} style={{ padding: '4px 8px' }} aria-label={`Cancel invite to ${i.email}`}>
              Cancel
            </button>
          </li>
        );})}
        {filtered.length === 0 && <li>No pending invites</li>}
      </ul>
      {confirm && (
        <div
          onClick={() => setConfirm(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 1000 }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-invite-title"
            onClick={(e) => e.stopPropagation()}
            ref={dialogRef}
            style={{ background: '#fff', padding: 16, borderRadius: 8, width: 'min(480px, 95vw)' }}
          >
            <h3 id="cancel-invite-title" style={{ marginTop: 0 }}>Cancel Invite</h3>
            <p>Cancel invite to <strong>{confirm.email}</strong>?</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={() => setConfirm(null)} style={{ padding: '6px 10px' }}>Keep</button>
              <button onClick={() => { const i = confirm; setConfirm(null); void doCancel(i); }} disabled={loadingId === confirm.id} style={{ padding: '6px 10px' }}>Cancel Invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
