import { describe, it, expect, vi } from 'vitest';

describe('lib/auth test-mode variants', async () => {
  it('returns null when AUTH_FORCE_NULL=1', async () => {
    process.env.NODE_ENV = 'test';
    process.env.AUTH_FORCE_NULL = '1';
    const mod = await import('@/src/lib/auth');
    const session = await mod.auth();
    expect(session).toBeNull();
    const res = await mod.handlers.GET(new Request('http://test'));
    expect(res.status).toBe(501);
    await expect(mod.signIn()).resolves.toBeUndefined();
    await expect(mod.signOut()).resolves.toBeUndefined();
  });

  it('defaults user id to "test-user" when TEST_USER_ID missing', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.TEST_USER_ID;
    delete process.env.AUTH_FORCE_NULL;
    vi.resetModules();
    const mod = await import('@/src/lib/auth');
    const session = await mod.auth();
    expect(session?.user?.id).toBe('test-user');
  });
});
