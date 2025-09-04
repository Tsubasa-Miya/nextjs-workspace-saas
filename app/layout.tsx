/* istanbul ignore file */
import Link from 'next/link';
import { auth } from '@/src/lib/auth';
import { SignOutButton } from '@/src/components/SignOutButton';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="ja">
      <body>
        <header style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderBottom: '1px solid #eee' }}>
          <Link href="/">Home</Link>
          <Link href="/dashboard">Dashboard</Link>
          <div style={{ marginLeft: 'auto' }}>
            {session?.user ? (
              <SignOutButton />
            ) : (
              <>
                <Link href="/login" style={{ marginRight: 8 }}>Login</Link>
                <Link href="/register">Sign up</Link>
              </>
            )}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
