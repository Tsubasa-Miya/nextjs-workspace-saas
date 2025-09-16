/* istanbul ignore file */
"use client";
import { useMemo, useState } from 'react';
import { useToast } from '@/src/components/toast/ToastProvider';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { Toolbar } from '@/src/components/ui/Toolbar';
import { Button } from '@/src/components/ui/Button';
import { Select } from '@/src/components/ui/Select';
import { Input } from '@/src/components/ui/Input';
import { shapeMessage } from '@/src/lib/fieldErrors';
import { apiFetch, postJson } from '@/src/lib/api';
import { invitesResend, invitesCancel } from '@/src/lib/apiPresets';

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
  const toast = useToast();

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
      const result = await invitesResend(workspaceId, { email: i.email, role: i.role });
      if (!result.ok && result.status !== 200) {
        const msg = result.error.message || 'Failed to send invite';
        setMessage(msg);
        toast.add(msg, 'danger');
      } else {
        const msg = result.status === 200 ? 'Invite resent (expiry extended)' : 'Invite sent';
        setMessage(msg);
        toast.add(msg);
        // If API returned new expiry, update the row without refetch; otherwise fallback to loading.
        if (result.ok && (result.data as any)?.expiresAt) {
          setInvites((prev) => prev.map((x) => (x.id === i.id ? { ...x, expiresAt: (result.data as any).expiresAt } : x)));
        } else {
          await loadInvites();
        }
      }
    } catch (e) {
      setMessage('Network error');
      toast.add('Network error', 'danger');
    } finally {
      setLoadingId(null);
    }
  }

  async function doCancel(i: Invite) {
    setMessage(null);
    setLoadingId(i.id);
    try {
      const result = await invitesCancel(workspaceId, i.id);
      if (!result.ok) {
        const msg = (result as any).error?.message || 'Failed to cancel invite';
        setMessage(msg);
        toast.add(msg, 'danger');
      } else {
        setInvites(invites.filter((x) => x.id !== i.id));
        setMessage('Invite canceled');
        toast.add('Invite canceled');
        await loadInvites();
      }
    } catch (e) {
      setMessage('Network error');
      toast.add('Network error', 'danger');
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
      toast.add('Link copied');
    } catch (_) {
      // Fallback: prompt
      const ok = window.prompt('Copy invite URL', acceptUrl);
      if (ok !== null) {
        setMessage('Link copied');
        toast.add('Link copied');
      }
    }
  }

  return (
    <div>
      <Toolbar>
        <label htmlFor="invites-filter" className="sr-only">Filter invites</label>
        <Input
          id="invites-filter"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by email"
          aria-label="Filter invites"
          style={{ maxWidth: 320, width: '100%' }}
        />
        <label className="row">
          <span className="muted">Role</span>
          <Select value={role} onChange={(e) => setRole(e.target.value as 'All' | 'Owner' | 'Admin' | 'Member')} aria-label="Filter invites by role">
            <option value="All">All</option>
            <option value="Owner">Owner</option>
            <option value="Admin">Admin</option>
            <option value="Member">Member</option>
          </Select>
        </label>
        <label className="row">
          <span className="muted">Sort</span>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'CreatedDesc' | 'ExpiresAsc' | 'EmailAsc')} aria-label="Sort invites">
            <option value="CreatedDesc">Newest</option>
            <option value="ExpiresAsc">Expires soon</option>
            <option value="EmailAsc">Email</option>
          </Select>
        </label>
        {message && <span role="status" aria-live="polite" className="muted" style={{ marginLeft: 'auto' }}>{message}</span>}
      </Toolbar>
      <ul>
        {displayed.map((i) => {
          const expired = isExpired(i);
          const soon = !expired && isExpiringSoon(i);
          return (
          <li key={i.id} className="card" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderColor: expired ? 'var(--danger)' : soon ? 'var(--warn)' : undefined }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{i.email} <small>({i.role})</small></span>
              {expired && (
                <span aria-label="Expired" title="Expired" className="badge danger">Expired</span>
              )}
              {soon && (
                <span aria-label="Expiring soon" title="Expiring soon" className="badge warn">Expiring soon</span>
              )}
            </span>
            <small className="muted">expires {new Date(i.expiresAt).toLocaleString()}</small>
            <Button size="sm" onClick={() => copy(i)} aria-label={`Copy invite link for ${i.email}`}>
              Copy link
            </Button>
            <Button size="sm" onClick={() => resend(i)} disabled={loadingId === i.id} aria-label={`Resend invite to ${i.email}`}>
              {loadingId === i.id ? 'Working…' : 'Resend'}
            </Button>
            <Button size="sm" variant="danger" onClick={() => setConfirm(i)} disabled={loadingId === i.id} aria-label={`Cancel invite to ${i.email}`}>
              Cancel
            </Button>
          </li>
        );})}
        {filtered.length === 0 && <li>No pending invites</li>}
      </ul>
      <ConfirmDialog
        open={!!confirm}
        title="Cancel Invite"
        description={confirm ? (
          <span>Cancel invite to <strong>{confirm.email}</strong>?</span>
        ) : undefined}
        confirmText="Cancel Invite"
        confirmVariant="danger"
        cancelText="Keep"
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          const i = confirm;
          setConfirm(null);
          await doCancel(i);
        }}
      />
    </div>
  );
}
