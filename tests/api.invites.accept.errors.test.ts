import { describe, it, expect, vi } from 'vitest';

describe('Invites accept API - error branches', () => {
  it('returns 410 when token expired', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        invite: { findUnique: vi.fn(async () => ({ id: 'i1', workspaceId: 'w1', role: 'Member', expiresAt: new Date(Date.now() - 1000) })) },
      },
    }));
    const { POST } = await import('@/app/api/invites/[token]/accept/route');
    const res = await POST(new Request('http://test/api/invites/exp/accept'), { params: { token: 'exp' } });
    expect(res.status).toBe(410);
  });
});
