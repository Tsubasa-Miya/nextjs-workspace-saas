import { describe, it, expect, vi } from 'vitest';

// Default mocks
vi.mock('@/src/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async () => ({ id: 'u2', email: 'ok@example.com', name: 'Ok' })),
    },
  },
}));
vi.mock('@/src/lib/hash', () => ({ hashPassword: vi.fn(async () => 'HASH') }));

describe('Auth register - success and 500', () => {
  it('201 on successful registration', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(new Request('http://test/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'ok@example.com', password: 'Password1!', name: 'Ok' }) }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe('u2');
  });

  it('500 on unexpected error during create', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { prisma } = await import('@/src/lib/db');
    (prisma.user.create as any).mockImplementationOnce(async () => { throw new Error('db'); });
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(new Request('http://test/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'ok@example.com', password: 'Password1!', name: 'Ok' }) }));
    expect(res.status).toBe(500);
  });
});
