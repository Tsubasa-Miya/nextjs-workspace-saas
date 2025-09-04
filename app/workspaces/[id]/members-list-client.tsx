/* istanbul ignore file */
"use client";
import { useMemo, useState } from 'react';

type Member = { id: string; name: string; email: string; role: 'Owner' | 'Admin' | 'Member' };

export function MembersListClient({ members, canManage, workspaceId }: { members: Member[]; canManage?: boolean; workspaceId: string }) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'All' | 'Owner' | 'Admin' | 'Member'>('All');
  const [list, setList] = useState<Member[]>(members);
  const [msg, setMsg] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return list.filter((m) => {
      const matchText = !t || m.name.toLowerCase().includes(t) || m.email.toLowerCase().includes(t);
      const matchRole = role === 'All' || m.role === role;
      return matchText && matchRole;
    });
  }, [q, role, list]);

  async function changeRole(userId: string, nextRole: Member['role']) {
    setMsg(null);
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: nextRole }),
      });
      const data = res.ok ? await res.json() : await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg((data && (data.error || data.message)) || 'Failed to change role');
      } else {
        setList((prev) => prev.map((m) => (m.id === userId ? { ...m, role: nextRole } : m)));
        setMsg('Role updated');
      }
    } catch (e) {
      setMsg('Network error');
    } finally {
      setLoadingId(null);
    }
  }

  async function removeMember(userId: string) {
    setMsg(null);
    if (!confirm('Remove this member from the workspace?')) return;
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
      const data = res.ok ? null : await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg((data && (data.error || data.message)) || 'Failed to remove member');
      } else {
        setList((prev) => prev.filter((m) => m.id !== userId));
        setMsg('Member removed');
      }
    } catch (e) {
      setMsg('Network error');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name or email"
          aria-label="Filter members"
          style={{ padding: 8, maxWidth: 360, width: '100%' }}
        />
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as 'All' | 'Owner' | 'Admin' | 'Member')} style={{ marginLeft: 6, padding: 8 }} aria-label="Filter by role">
            <option value="All">All</option>
            <option value="Owner">Owner</option>
            <option value="Admin">Admin</option>
            <option value="Member">Member</option>
          </select>
        </label>
        {msg && <span role="status" aria-live="polite" style={{ marginLeft: 'auto' }}>{msg}</span>}
      </div>
      <ul>
        {filtered.map((m) => (
          <li key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>{m.name || m.email}</span>
            <small>({m.role})</small>
            {canManage && (
              <label style={{ marginLeft: 8 }}>
                Change role
                <select
                  value={m.role}
                  onChange={(e) => changeRole(m.id, e.target.value as Member['role'])}
                  disabled={loadingId === m.id}
                  style={{ marginLeft: 6 }}
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                  <option value="Owner">Owner</option>
                </select>
              </label>
            )}
            {canManage && (
              <button onClick={() => removeMember(m.id)} disabled={loadingId === m.id} style={{ padding: '4px 8px' }} aria-label={`Remove ${m.name || m.email}`}>
                Remove
              </button>
            )}
          </li>
        ))}
        {filtered.length === 0 && <li>No members</li>}
      </ul>
    </section>
  );
}
