import { describe, it, expect, vi } from 'vitest';

describe('Workspaces GET - prisma error', () => {
  it('throws when membership.findMany fails', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { membership: { findMany: vi.fn(async () => { throw new Error('fail'); }) } } }));
    const { GET } = await import('@/app/api/workspaces/route');
    await expect(GET()).rejects.toThrow();
  });
});

