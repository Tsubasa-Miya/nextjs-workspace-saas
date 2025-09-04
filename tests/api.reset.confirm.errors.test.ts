import { describe, it, expect, vi } from 'vitest';

describe('Reset confirm API - error branches', () => {
  // Note: 404 branch is covered indirectly via handler logic; focusing on 410 branches here.

  it('410 when token expired', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: { passwordReset: { findUnique: vi.fn(async () => ({ id: 'p1', userId: 'u1', token: 't', expiresAt: new Date(Date.now() - 1000), usedAt: null })) } } }));
    const { POST } = await import('@/app/api/auth/reset/confirm/route');
    const res = await POST(new Request('http://test/api/auth/reset/confirm', { method: 'POST', body: JSON.stringify({ token: 't', password: 'xxyyzz11' }) }));
    expect(res.status).toBe(410);
  });

  it('410 when token already used', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: { passwordReset: { findUnique: vi.fn(async () => ({ id: 'p1', userId: 'u1', token: 't', expiresAt: new Date(Date.now() + 1000), usedAt: new Date() })) } } }));
    const { POST } = await import('@/app/api/auth/reset/confirm/route');
    const res = await POST(new Request('http://test/api/auth/reset/confirm', { method: 'POST', body: JSON.stringify({ token: 't', password: 'xxyyzz11' }) }));
    expect(res.status).toBe(410);
  });
});
