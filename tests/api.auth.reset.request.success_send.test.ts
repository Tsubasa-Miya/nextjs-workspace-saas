import { describe, it, expect, vi } from 'vitest';

describe('Auth reset request - send success path', () => {
  it('200 and sends email when user exists', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        user: { findUnique: vi.fn(async () => ({ id: 'u1', email: 'a@example.com' })) },
        passwordReset: { create: vi.fn(async () => ({ id: 'p1' })) },
      },
    }));
    vi.mock('@/src/lib/email', () => ({ sendEmail: vi.fn(async () => ({})) }));
    const { POST } = await import('@/app/api/auth/reset/route');
    const res = await POST(new Request('http://test/api/auth/reset', { method: 'POST', body: JSON.stringify({ email: 'a@example.com' }) }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});

