import { describe, it, expect, vi } from 'vitest';

describe('Workspaces create - conflict 409', () => {
  it('returns 409 on unique conflict', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        $transaction: vi.fn(async () => { const e: any = new Error('conflict'); e.code = 'P2002'; throw e; }),
      },
    }));
    const { POST } = await import('@/app/api/workspaces/route');
    const res = await POST(new Request('http://test/api/workspaces', { method: 'POST', body: JSON.stringify({ name: 'N', slug: 'new' }) }));
    expect(res.status).toBe(409);
  });
});
