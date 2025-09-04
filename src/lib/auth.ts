import type { SessionLike } from './types';

type AuthFn = () => Promise<SessionLike>;
type RouteHandler = (req: Request) => Promise<Response>;
type Handlers = { GET: RouteHandler; POST: RouteHandler };
type SignFn = (...args: unknown[]) => Promise<void>;

let authExport: AuthFn | null = null;
let handlersExport: Handlers | null = null;
let signInExport: SignFn = async () => {};
let signOutExport: SignFn = async () => {};

// Treat Vitest runs as test environment to make module mocking reliable
if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
  if (process.env.AUTH_FORCE_NULL === '1') {
    authExport = async () => null;
  } else {
    authExport = async () => ({ user: { id: process.env.TEST_USER_ID || 'test-user' } });
  }
  handlersExport = { GET: async () => new Response('NA', { status: 501 }), POST: async () => new Response('NA', { status: 501 }) };
  signInExport = async () => {};
  signOutExport = async () => {};
} else {
  const { default: NextAuth } = await import('next-auth');
  const { default: Credentials } = await import('next-auth/providers/credentials');
  const { prisma } = await import('./db');
  const { verifyPassword } = await import('./hash');

  const na = NextAuth({
    session: { strategy: 'jwt' },
    providers: [
      Credentials({
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'text' },
          password: { label: 'Password', type: 'password' },
        },
        authorize: async (credentials) => {
          const email = String((credentials as Record<string, unknown> | undefined)?.email ?? '').toLowerCase().trim();
          const password = typeof (credentials as Record<string, unknown> | undefined)?.password === 'string'
            ? ((credentials as Record<string, unknown>).password as string)
            : '';
          if (!email || !password) return null;

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;
          const ok = await verifyPassword(user.passwordHash, password);
          if (!ok) return null;

          const u = { id: user.id, email: user.email, name: user.name };
          return u as unknown as object; // satisfy NextAuth User shape without loose typing
        },
      }),
    ],
    pages: {},
    callbacks: {
      async jwt({ token, user }) {
        if (user && typeof (user as { id?: unknown }).id === 'string') {
          (token as unknown as { userId?: string }).userId = (user as { id: string }).id;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          const userId = (token as unknown as { userId?: unknown }).userId;
          if (typeof userId === 'string') {
            (session.user as { id?: string }).id = userId;
          }
          // activeWorkspaceId and role can be set via a separate endpoint if needed
        }
        return session;
      },
    },
  });
  authExport = na.auth as unknown as AuthFn;
  handlersExport = na.handlers as unknown as Handlers;
  signInExport = na.signIn as unknown as SignFn;
  signOutExport = na.signOut as unknown as SignFn;
}

export const auth: AuthFn = authExport!;
export const handlers: Handlers = handlersExport!;
export const signIn: SignFn = signInExport;
export const signOut: SignFn = signOutExport;

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  activeWorkspaceId?: string | null;
  role?: 'Owner' | 'Admin' | 'Member';
};
