/* istanbul ignore file */
"use client";
import { useState } from 'react';
import { useToast } from '@/src/components/toast/ToastProvider';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Button } from '@/src/components/ui/Button';
import { FormField } from '@/src/components/ui/FormField';
import { extractFieldErrors, firstFieldError, shapeMessage } from '@/src/lib/fieldErrors';
import { postJson } from '@/src/lib/api';

export function InviteForm({ workspaceId }: { workspaceId: string }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Member' | 'Admin' | 'Owner'>('Member');
  const [message, setMessage] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [roleErr, setRoleErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

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
    setEmailErr(null); setRoleErr(null);
    try {
      const result = await postJson(`/api/workspaces/${workspaceId}/invites`, { email, role });
      if (!result.ok && result.status !== 200) {
        const fe = result.error.fieldErrors;
        setEmailErr(firstFieldError(fe, 'email'));
        setRoleErr(firstFieldError(fe, 'role'));
        const msg = result.error.message || 'Failed to send invite';
        setMessage(msg);
        toast.add(msg, 'danger');
      }
      else {
        const msg = result.status === 200 ? 'Invite resent (expiry extended)' : 'Invite sent';
        setMessage(msg);
        toast.add(msg);
        setEmail('');
        setRole('Member');
      }
    } catch (err) {
      setMessage('Network error');
      toast.add('Network error', 'danger');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack" aria-live="polite">
      <div className="row" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <FormField id="invite-email" label="Email" required error={emailErr || undefined}>
          <Input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ maxWidth: 320 }} />
        </FormField>
        <FormField id="invite-role" label="Role" help="Member by default" error={roleErr || undefined}>
          <Select value={role} onChange={(e) => setRole(e.target.value as 'Member' | 'Admin' | 'Owner')}>
            <option value="Member">Member</option>
            <option value="Admin">Admin</option>
          </Select>
        </FormField>
        <Button variant="primary" type="submit" loading={loading} aria-label="Send workspace invite">
          Send invite
        </Button>
      </div>
      {message && <span role="status" aria-live="polite" className="muted">{message}</span>}
    </form>
  );
}
