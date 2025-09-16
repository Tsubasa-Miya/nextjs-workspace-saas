/* istanbul ignore file */
"use client";
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/src/components/toast/ToastProvider';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { FieldError } from '@/src/components/ui/FieldError';
import { FormField } from '@/src/components/ui/FormField';
import { extractFieldErrors, firstFieldError, shapeMessage } from '@/src/lib/fieldErrors';
import { postJson } from '@/src/lib/api';
import { authRegister } from '@/src/lib/apiPresets';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const pwdTooShort = password.length > 0 && password.length < 8;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNameErr(null); setEmailErr(null); setPasswordErr(null);
    try {
      const result = await authRegister({ email, password, name });
      if (!result.ok) {
        const fe = extractFieldErrors(result.data);
        setNameErr(firstFieldError(fe, 'name'));
        setEmailErr(firstFieldError(fe, 'email'));
        setPasswordErr(firstFieldError(fe, 'password'));
        const message = result.error.message || 'Failed to register';
        setError(message);
        toast.add(message, 'danger');
      } else {
        // Redirect to login page after successful registration
        toast.add('Account created. Please sign in');
        router.push('/login');
      }
    } catch (err) {
      setError('Network error');
      toast.add('Network error', 'danger');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" role="main">
      <div className="stack" style={{ maxWidth: 420 }}>
        <h1>Sign up</h1>
        <form onSubmit={onSubmit} className="stack">
          <FormField id="name" label="Name" error={nameErr || undefined}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField id="email" label="Email" required error={emailErr || undefined}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <FormField id="password" label="Password" required help="8–128 characters" error={passwordErr || (pwdTooShort ? 'Must be at least 8 characters' : undefined)}>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={128} />
          </FormField>
          <Button variant="primary" type="submit" loading={loading}>Create account</Button>
          <FieldError>{error}</FieldError>
        </form>
      </div>
    </main>
  );
}
