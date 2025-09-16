import { describe, it, expect, vi } from 'vitest';

const st = vi.hoisted(() => {
  return {
    capturedJwt: null as null | ((args: any) => Promise<any>),
    capturedSession: null as null | ((args: any) => Promise<any>),
  };
});

vi.mock('next-auth', () => ({
  default: (config: any) => {
    st.capturedJwt = config?.callbacks?.jwt;
    st.capturedSession = config?.callbacks?.session;
    return {
      auth: async () => ({ user: { id: 'x' } }),
      handlers: { GET: async () => new Response('ok'), POST: async () => new Response('ok') },
      signIn: async () => {},
      signOut: async () => {},
    };
  },
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: (opts: any) => ({ id: 'credentials', ...opts }),
}));

describe('auth callbacks (jwt/session)', () => {
  it('jwt sets userId when user present; otherwise returns token', async () => {
    const prev = { NODE_ENV: process.env.NODE_ENV, VITEST: process.env.VITEST };
    process.env.NODE_ENV = 'production';
    delete (process.env as any).VITEST;
    vi.resetModules();
    await import('@/src/lib/auth');
    const jwt = st.capturedJwt!;
    let tok = await jwt({ token: {}, user: { id: 'u-1' } });
    expect((tok as any).userId).toBe('u-1');
    tok = await jwt({ token: { a: 1 }, user: null });
    expect((tok as any).a).toBe(1);
    process.env.NODE_ENV = prev.NODE_ENV;
    if (prev.VITEST !== undefined) process.env.VITEST = prev.VITEST; else delete (process.env as any).VITEST;
  });

  it('session copies userId into session.user.id only when present', async () => {
    const prev = { NODE_ENV: process.env.NODE_ENV, VITEST: process.env.VITEST };
    process.env.NODE_ENV = 'production';
    delete (process.env as any).VITEST;
    vi.resetModules();
    await import('@/src/lib/auth');
    const sessionCb = st.capturedSession!;

    // case: session has user and token has userId
    let sess = await sessionCb({ session: { user: {} }, token: { userId: 'zz' } });
    expect((sess as any).user.id).toBe('zz');

    // case: session has user but no userId on token
    sess = await sessionCb({ session: { user: {} }, token: {} });
    expect((sess as any).user.id).toBeUndefined();

    // case: session has no user
    const sess2 = await sessionCb({ session: {}, token: { userId: 'a' } });
    expect((sess2 as any).user).toBeUndefined();

    process.env.NODE_ENV = prev.NODE_ENV;
    if (prev.VITEST !== undefined) process.env.VITEST = prev.VITEST; else delete (process.env as any).VITEST;
  });
});

