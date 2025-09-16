import { describe, it, expect, vi } from 'vitest';

const hoisted = vi.hoisted(() => {
  return {
    authFn: vi.fn(async () => ({ user: { id: 'n' } } as any)),
    getFn: vi.fn(async () => new Response('ok')),
    postFn: vi.fn(async () => new Response('ok')),
    signInFn: vi.fn(async () => {}),
    signOutFn: vi.fn(async () => {}),
  };
});

describe('lib/auth non-test env branch', () => {
  it('initializes via NextAuth and exposes handlers/sign', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origVitest = process.env.VITEST;
    process.env.NODE_ENV = 'production';
    // Make the module think we are not in vitest mode
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (process.env as any).VITEST;

    vi.resetModules();

    vi.mock('next-auth', () => ({
      default: (_config: any) => ({ auth: hoisted.authFn, handlers: { GET: hoisted.getFn, POST: hoisted.postFn }, signIn: hoisted.signInFn, signOut: hoisted.signOutFn }),
    }));
    vi.mock('next-auth/providers/credentials', () => ({
      default: (opts: any) => ({ id: 'credentials', ...opts }),
    }));

    // Avoid touching real prisma/hash modules; they'll be imported but not used.
    const mod = await import('@/src/lib/auth');
    expect(typeof mod.auth).toBe('function');
    expect(typeof mod.handlers.GET).toBe('function');
    expect(typeof mod.handlers.POST).toBe('function');
    await expect(mod.signIn()).resolves.toBeUndefined();
    await expect(mod.signOut()).resolves.toBeUndefined();
    // cleanup env
    process.env.NODE_ENV = origNodeEnv;
    if (origVitest !== undefined) process.env.VITEST = origVitest; else delete (process.env as any).VITEST;
  });
});
