import { describe, it, expect, vi } from 'vitest';

describe('Workspaces create - unknown prisma error -> 500', () => {
  it('500 when transaction throws non-P2002 error', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { $transaction: vi.fn(async () => { throw new Error('boom'); }) } }));
    const { POST } = await import('@/app/api/workspaces/route');
    const res = await POST(new Request('http://test/api/workspaces', { method: 'POST', body: JSON.stringify({ name: 'X', slug: 'xyz' }) }));
    expect(res.status).toBe(500);
  });
});
