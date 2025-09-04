import { describe, it, expect, vi } from 'vitest';

vi.mock('@/src/lib/db', () => ({
  prisma: {
    passwordReset: { findUnique: vi.fn(async () => null) },
    $transaction: vi.fn(async (cb: any) => cb({
      user: { update: vi.fn(async () => ({})) },
      passwordReset: { update: vi.fn(async () => ({})) },
    })),
  },
}));
vi.mock('@/src/lib/hash', () => ({ hashPassword: vi.fn(async () => 'HASH') }));

describe('Reset confirm - used/expired/success', () => {
  it('410 when token already used', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { prisma } = await import('@/src/lib/db');
    (prisma.passwordReset.findUnique as any).mockResolvedValueOnce({ token: 't', userId: 'u1', usedAt: new Date(), expiresAt: new Date(Date.now() + 10000) });
    const { POST } = await import('@/app/api/auth/reset/confirm/route');
    const res = await POST(new Request('http://test/api/auth/reset/confirm', { method: 'POST', body: JSON.stringify({ token: 't', password: 'ValidPass99' }) }));
    expect(res.status).toBe(410);
  });

  it('410 when token expired', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { prisma } = await import('@/src/lib/db');
    (prisma.passwordReset.findUnique as any).mockResolvedValueOnce({ token: 't', userId: 'u1', usedAt: null, expiresAt: new Date(Date.now() - 1000) });
    const { POST } = await import('@/app/api/auth/reset/confirm/route');
    const res = await POST(new Request('http://test/api/auth/reset/confirm', { method: 'POST', body: JSON.stringify({ token: 't', password: 'ValidPass99' }) }));
    expect(res.status).toBe(410);
  });

  it('200 and updates password when valid', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { prisma } = await import('@/src/lib/db');
    (prisma.passwordReset.findUnique as any).mockResolvedValueOnce({ token: 't', userId: 'u1', usedAt: null, expiresAt: new Date(Date.now() + 1000) });
    const { POST } = await import('@/app/api/auth/reset/confirm/route');
    const res = await POST(new Request('http://test/api/auth/reset/confirm', { method: 'POST', body: JSON.stringify({ token: 't', password: 'ValidPass99' }) }));
    expect(res.status).toBe(200);
  });
});
