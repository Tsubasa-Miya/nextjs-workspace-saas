/* istanbul ignore file */
"use client";
import type { FormEvent } from 'react';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/src/components/toast/ToastProvider';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { FieldError } from '@/src/components/ui/FieldError';
import { FormField } from '@/src/components/ui/FormField';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signIn('credentials', { redirect: false, email, password });
      if (res?.error) {
        const msg = 'Invalid email or password';
        setError(msg);
        toast.add(msg, 'danger');
      } else {
        toast.add('Signed in');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (_) {
      const msg = 'Network error';
      setError(msg);
      toast.add(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" role="main">
      <div className="stack" style={{ maxWidth: 420 }}>
        <h1>Login</h1>
        <form onSubmit={onSubmit} className="stack">
          <FormField id="email" label="Email" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <FormField id="password" label="Password" required>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormField>
          <Button variant="primary" type="submit" loading={loading}>Sign in</Button>
          <FieldError>{error}</FieldError>
        </form>
        <p className="muted">
          Forgot password? <a href="/reset">Reset here</a>
        </p>
      </div>
    </main>
  );
}
