/* istanbul ignore file */
"use client";
import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function InviteAcceptPage({ params }: { params: { token: string } }) {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState<string>('Processing invitation…');
  const router = useRouter();

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
        const res = await fetch(`/api/invites/${params.token}/accept`, { method: 'GET' });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data?.error ?? 'Failed to accept invitation');
        } else {
          setMessage('Invitation accepted. Redirecting to dashboard…');
          router.push('/dashboard');
        }
      } catch (e) {
        setMessage('Network error');
      }
    }
    run();
  }, [status, session, params.token, router]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Accept Invitation</h1>
      <p>{message}</p>
    </main>
  );
}
