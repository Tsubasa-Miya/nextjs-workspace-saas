import { describe, it, expect } from 'vitest';

describe('lib/auth test mode', async () => {
  it('auth returns user in test mode', async () => {
    process.env.NODE_ENV = 'test';
    process.env.TEST_USER_ID = 'u-test';
    const mod = await import('@/src/lib/auth');
    const session = await mod.auth();
    expect(session?.user?.id).toBe('u-test');
    expect(mod.handlers).toBeDefined();
  });
});

