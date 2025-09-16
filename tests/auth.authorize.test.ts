import { describe, it, expect, vi } from 'vitest';

// Hoisted shared fakes so vi.mock factories can access them
const st = vi.hoisted(() => {
  return {
    capturedAuthorize: null as null | ((creds: any) => Promise<any>),
    prismaFind: vi.fn(),
    verify: vi.fn(),
  };
});

// Mock Credentials provider to capture authorize
vi.mock('next-auth/providers/credentials', () => ({
  default: (opts: any) => {
    st.capturedAuthorize = opts.authorize;
    return { id: 'credentials', ...opts };
  },
}));

// Mock NextAuth to avoid real framework and just accept config
vi.mock('next-auth', () => ({
  default: (_config: any) => ({
    auth: async () => ({ user: { id: 'n' } }),
    handlers: { GET: async () => new Response('ok'), POST: async () => new Response('ok') },
    signIn: async () => {},
    signOut: async () => {},
  }),
}));

// Mock db/hash used inside authorize
vi.mock('@/src/lib/db', () => ({
  prisma: { user: { findUnique: st.prismaFind } },
}));
vi.mock('@/src/lib/hash', () => ({
  verifyPassword: st.verify,
}));

describe('auth Credentials.authorize', () => {
  it('returns null when email or password missing', async () => {
    const prev = { NODE_ENV: process.env.NODE_ENV, VITEST: process.env.VITEST };
    process.env.NODE_ENV = 'production';
    delete (process.env as any).VITEST;
    vi.resetModules();
    await import('@/src/lib/auth');

    expect(typeof st.capturedAuthorize).toBe('function');
    const a = st.capturedAuthorize!;
    // empty email
    await expect(a({ email: '', password: 'x' })).resolves.toBeNull();
    // empty password
    await expect(a({ email: 'a@b.com', password: '' })).resolves.toBeNull();
    // non-string password goes to ternary else-path => treated as ''
    await expect(a({ email: 'a@b.com', password: 123 as any })).resolves.toBeNull();

    // restore env
    process.env.NODE_ENV = prev.NODE_ENV;
    if (prev.VITEST !== undefined) process.env.VITEST = prev.VITEST; else delete (process.env as any).VITEST;
  });

  it('returns null when user not found', async () => {
    const prev = { NODE_ENV: process.env.NODE_ENV, VITEST: process.env.VITEST };
    process.env.NODE_ENV = 'production';
    delete (process.env as any).VITEST;
    st.prismaFind.mockResolvedValueOnce(null);
    vi.resetModules();
    await import('@/src/lib/auth');

    const a = st.capturedAuthorize!;
    await expect(a({ email: 'No@User.com', password: 'p' })).resolves.toBeNull();

    process.env.NODE_ENV = prev.NODE_ENV;
    if (prev.VITEST !== undefined) process.env.VITEST = prev.VITEST; else delete (process.env as any).VITEST;
  });

  it('returns null when password invalid', async () => {
    const prev = { NODE_ENV: process.env.NODE_ENV, VITEST: process.env.VITEST };
    process.env.NODE_ENV = 'production';
    delete (process.env as any).VITEST;
    st.prismaFind.mockResolvedValueOnce({ id: 'u1', email: 'u@e', name: 'U', passwordHash: 'hash' });
    st.verify.mockResolvedValueOnce(false);
    vi.resetModules();
    await import('@/src/lib/auth');

    const a = st.capturedAuthorize!;
    await expect(a({ email: 'U@E', password: 'bad' })).resolves.toBeNull();

    process.env.NODE_ENV = prev.NODE_ENV;
    if (prev.VITEST !== undefined) process.env.VITEST = prev.VITEST; else delete (process.env as any).VITEST;
  });

  it('returns user when password ok', async () => {
    const prev = { NODE_ENV: process.env.NODE_ENV, VITEST: process.env.VITEST };
    process.env.NODE_ENV = 'production';
    delete (process.env as any).VITEST;
    st.prismaFind.mockResolvedValueOnce({ id: 'u2', email: 'u2@e', name: 'U2', passwordHash: 'hash' });
    st.verify.mockResolvedValueOnce(true);
    vi.resetModules();
    await import('@/src/lib/auth');

    const a = st.capturedAuthorize!;
    const result = await a({ email: ' U2@E ', password: 'good' });
    expect(result).toEqual({ id: 'u2', email: 'u2@e', name: 'U2' });

    process.env.NODE_ENV = prev.NODE_ENV;
    if (prev.VITEST !== undefined) process.env.VITEST = prev.VITEST; else delete (process.env as any).VITEST;
  });
});
