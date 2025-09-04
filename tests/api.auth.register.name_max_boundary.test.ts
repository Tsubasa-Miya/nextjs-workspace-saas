import { describe, it, expect, vi } from 'vitest';

describe('Auth register - name max boundary', () => {
  it('201 when name length == 120', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: { user: { findUnique: vi.fn(async () => null), create: vi.fn(async () => ({ id: 'u1', email: 'e@example.com', name: 'n' })) } } }));
    const { POST } = await import('@/app/api/auth/register/route');
    const name = 'n'.repeat(120);
    const res = await POST(new Request('http://test/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'e@example.com', password: 'Password1!', name }) }));
    expect(res.status).toBe(201);
  });
});

