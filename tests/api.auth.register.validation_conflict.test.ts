import { describe, it, expect, vi } from 'vitest';

describe('Auth register - validation and conflict', () => {
  it('400 on invalid email and short password', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { POST } = await import('@/app/api/auth/register/route');
    const res1 = await POST(new Request('http://test/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'bad', password: '123', name: 'A' }) }));
    expect(res1.status).toBe(400);
  });

  it('409 when email already exists', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: { user: { findUnique: vi.fn(async () => ({ id: 'u1', email: 'e@example.com' })) } } }));
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(new Request('http://test/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'e@example.com', password: 'Password1!', name: 'A' }) }));
    expect(res.status).toBe(409);
  });
});

