/* istanbul ignore file */
"use client";
import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/src/components/toast/ToastProvider';
import { apiFetch } from '@/src/lib/api';
import { inviteAccept } from '@/src/lib/apiPresets';

export default function InviteAcceptPage({ params }: { params: { token: string } }) {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState<string>('Processing invitation…');
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    async function run() {
      if (status === 'loading') return;
      if (!session) {
        setMessage('Please sign in to accept the invitation. Redirecting to login…');
        const callbackUrl = `/invites/${params.token}`;
        await signIn(undefined, { callbackUrl });
        return;
      }
      try {
        const result = await inviteAccept(params.token);
        if (!result.ok) {
          const msg = (result as any).error?.message || 'Failed to accept invitation';
          setMessage(msg);
          toast.add(msg, 'danger');
        } else {
          const msg = 'Invitation accepted. Redirecting to dashboard…';
          setMessage(msg);
          toast.add('Invitation accepted');
          router.push('/dashboard');
        }
      } catch (e) {
        setMessage('Network error');
        toast.add('Network error', 'danger');
      }
    }
    run();
  }, [status, session, params.token, router]);

  return (
    <main className="container">
      <div className="stack" style={{ maxWidth: 560 }}>
        <h1>Accept Invitation</h1>
        <p className="muted">{message}</p>
      </div>
    </main>
  );
}
