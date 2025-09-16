import { describe, it, expect, vi } from 'vitest';

describe('Invites accept - internal error 500', () => {
  it('500 when db throws during lookup', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        invite: { findUnique: vi.fn(async () => { throw new Error('db'); }) },
      },
    }));
    const { POST } = await import('@/app/api/invites/[token]/accept/route');
    const res = await POST(new Request('http://test/api/invites/tok/accept'), { params: { token: 'tok' } });
    expect(res.status).toBe(500);
  });
});

