/* istanbul ignore file */
"use client";
import { useMemo, useState } from 'react';
import { useToast } from '@/src/components/toast/ToastProvider';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { Toolbar } from '@/src/components/ui/Toolbar';
import { Button } from '@/src/components/ui/Button';
import { Select } from '@/src/components/ui/Select';
import { Input } from '@/src/components/ui/Input';
import { membersPatch, membersDelete } from '@/src/lib/apiPresets';

type Member = { id: string; name: string; email: string; role: 'Owner' | 'Admin' | 'Member' };

export function MembersListClient({ members, canManage, workspaceId }: { members: Member[]; canManage?: boolean; workspaceId: string }) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'All' | 'Owner' | 'Admin' | 'Member'>('All');
  const [list, setList] = useState<Member[]>(members);
  const [msg, setMsg] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const toast = useToast();
  const [pendingRemove, setPendingRemove] = useState<Member | null>(null);

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
      const result = await membersPatch(workspaceId, { userId, role: nextRole });
      if (!result.ok) {
        const m = result.error.message || 'Failed to change role';
        setMsg(m);
        toast.add(m, 'danger');
      } else {
        setList((prev) => prev.map((m) => (m.id === userId ? { ...m, role: nextRole } : m)));
        setMsg('Role updated');
        toast.add('Role updated');
      }
    } catch (e) {
      setMsg('Network error');
      toast.add('Network error', 'danger');
    } finally {
      setLoadingId(null);
    }
  }

  async function removeMember(userId: string) {
    setMsg(null);
    setLoadingId(userId);
    try {
      const result = await membersDelete(workspaceId, userId);
      if (!result.ok) {
        const m = result.error.message || 'Failed to remove member';
        setMsg(m);
        toast.add(m, 'danger');
      } else {
        setList((prev) => prev.filter((m) => m.id !== userId));
        setMsg('Member removed');
        toast.add('Member removed');
      }
    } catch (e) {
      setMsg('Network error');
      toast.add('Network error', 'danger');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="stack">
      <Toolbar>
        <label htmlFor="members-filter" className="sr-only">Filter members</label>
        <Input
          id="members-filter"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name or email"
          aria-label="Filter members"
          style={{ maxWidth: 360, width: '100%' }}
        />
        <label className="row">
          <span className="muted">Role</span>
          <Select value={role} onChange={(e) => setRole(e.target.value as 'All' | 'Owner' | 'Admin' | 'Member')} aria-label="Filter by role">
            <option value="All">All</option>
            <option value="Owner">Owner</option>
            <option value="Admin">Admin</option>
            <option value="Member">Member</option>
          </Select>
        </label>
        {msg && <span role="status" aria-live="polite" className="muted" style={{ marginLeft: 'auto' }}>{msg}</span>}
      </Toolbar>
      <ul>
        {filtered.map((m) => (
          <li key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '6px 0' }}>
            <span>{m.name || m.email}</span>
            <small className="muted">({m.role})</small>
            {canManage && (
              <label className="row" style={{ marginLeft: 8 }}>
                <span className="muted">Change role</span>
                <Select
                  value={m.role}
                  onChange={(e) => changeRole(m.id, e.target.value as Member['role'])}
                  disabled={loadingId === m.id}
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                  <option value="Owner">Owner</option>
                </Select>
              </label>
            )}
            {canManage && (
              <Button size="sm" variant="danger" onClick={() => setPendingRemove(m)} disabled={loadingId === m.id} aria-label={`Remove ${m.name || m.email}`}>
                Remove
              </Button>
            )}
          </li>
        ))}
        {filtered.length === 0 && <li>No members</li>}
      </ul>
      <ConfirmDialog
        open={!!pendingRemove}
        title="Remove Member"
        description={
          pendingRemove ? (
            <span>Remove <strong>{pendingRemove.name || pendingRemove.email}</strong> from this workspace?</span>
          ) : undefined
        }
        confirmText="Remove"
        confirmVariant="danger"
        cancelText="Cancel"
        onCancel={() => setPendingRemove(null)}
        onConfirm={async () => {
          if (!pendingRemove) return;
          const id = pendingRemove.id;
          setPendingRemove(null);
          await removeMember(id);
        }}
      />
    </section>
  );
}
