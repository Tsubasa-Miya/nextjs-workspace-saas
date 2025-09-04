import { describe, it, expect, vi } from 'vitest';

describe('Auth reset request API - errors', () => {
  it('400 on invalid email', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { POST } = await import('@/app/api/auth/reset/route');
    const res = await POST(new Request('http://test/api/auth/reset', { method: 'POST', body: JSON.stringify({ email: 'not-an-email' }) }));
    expect(res.status).toBe(400);
  });

  it('still returns 200 when sendEmail throws', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        user: { findUnique: vi.fn(async () => ({ id: 'u1', email: 'a@example.com' })) },
        passwordReset: { create: vi.fn(async () => ({ id: 'p1' })) },
      },
    }));
    vi.mock('@/src/lib/email', () => ({ sendEmail: vi.fn(async () => { throw new Error('ses fail'); }) }));
    const { POST } = await import('@/app/api/auth/reset/route');
    const res = await POST(new Request('http://test/api/auth/reset', { method: 'POST', body: JSON.stringify({ email: 'a@example.com' }) }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});

