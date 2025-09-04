import { describe, it, expect, vi } from 'vitest';

describe('Reset confirm - token not found', () => {
  it('404 on missing token', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: { passwordReset: { findUnique: vi.fn(async () => null) } } }));
    const { POST } = await import('@/app/api/auth/reset/confirm/route');
    const res = await POST(new Request('http://test/api/auth/reset/confirm', { method: 'POST', body: JSON.stringify({ token: 'missing', password: 'ValidPass99' }) }));
    expect(res.status).toBe(404);
  });
});

