/* istanbul ignore file */
import Link from 'next/link';
import { auth } from '@/src/lib/auth';
import { NotificationsButton } from '@/src/components/NotificationsButton';
import { UserMenu } from '@/src/components/UserMenu';
import Providers from '@/src/components/providers';
import './globals.css';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="ja">
      <body>
        <header className="topnav">
          <Link className="nav-link" href="/">Home</Link>
          <Link className="nav-link" href="/dashboard">Dashboard</Link>
          <div className="spacer" />
          <div>
            {session?.user ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <NotificationsButton />
                <UserMenu name={session.user.name} email={session.user.email} />
              </div>
            ) : (
              <>
                <Link className="nav-link" href="/login">Login</Link>
                <Link className="nav-link" href="/register">Sign up</Link>
              </>
            )}
          </div>
        </header>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
