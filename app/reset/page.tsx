/* istanbul ignore file */
"use client";
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/src/components/toast/ToastProvider';
import { shapeMessage } from '@/src/lib/fieldErrors';
import { postJson } from '@/src/lib/api';
import { resetConfirm as resetConfirmApi } from '@/src/lib/apiPresets';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { FormField } from '@/src/components/ui/FormField';

export default function ResetPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const pwdTooShort = password.length > 0 && password.length < 8;
  const mismatch = !!password && !!confirm && password !== confirm;
  const [pwdErr, setPwdErr] = useState<string | null>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);

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
    setPwdErr(null);
    setConfirmErr(null);
    try {
      const result = await resetConfirmApi({ token, password });
      if (!result.ok) {
        const msg = result.error.message || 'Failed to reset password';
        // map field errors if present
        const fe = (result.data && (result.data as any).error) as any;
        if (fe && typeof fe === 'object' && fe.fieldErrors && typeof fe.fieldErrors === 'object') {
          const fieldErrorsObj = fe.fieldErrors as Record<string, unknown>;
          const pArr = Array.isArray(fieldErrorsObj['password']) ? (fieldErrorsObj['password'] as unknown[]) : [];
          setPwdErr((pArr.find((v) => typeof v === 'string') as string) || null);
        }
        setMessage(msg);
        toast.add(msg, 'danger');
      } else {
        const msg = 'Password updated. You may now log in.';
        setMessage(msg);
        toast.add(msg);
      }
    } catch (err) {
      setMessage('Network error');
      toast.add('Network error', 'danger');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container" role="main">
      <div className="stack" style={{ maxWidth: 420 }}>
        <h1>Reset Password</h1>
        {!token ? (
          <p className="muted">Invalid or missing token.</p>
        ) : (
          <form onSubmit={onSubmit} className="stack">
            <FormField id="reset-password" label="New password" required help="8–128 characters" error={pwdErr || (pwdTooShort ? 'Must be at least 8 characters' : undefined)}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={128}
              />
            </FormField>
            <FormField id="reset-confirm" label="Confirm password" required error={confirmErr || (mismatch ? 'Passwords do not match' : undefined)}>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                maxLength={128}
              />
            </FormField>
            <Button variant="primary" type="submit" loading={submitting} disabled={!token || !password || password !== confirm}>Reset password</Button>
            {message && <p className="muted">{message}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
