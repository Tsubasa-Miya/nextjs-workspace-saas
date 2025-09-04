import { describe, it, expect, vi } from 'vitest';

describe('Auth reset request - internal error 500', () => {
  it('500 when unexpected error occurs', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    // Make DB call throw to hit top-level catch
    vi.mock('@/src/lib/db', () => ({ prisma: { user: { findUnique: vi.fn(async () => { throw new Error('db'); }) } } }));
    const { POST } = await import('@/app/api/auth/reset/route');
    const res = await POST(new Request('http://test/api/auth/reset', { method: 'POST', body: JSON.stringify({ email: 'a@example.com' }) }));
    expect(res.status).toBe(500);
  });
});

