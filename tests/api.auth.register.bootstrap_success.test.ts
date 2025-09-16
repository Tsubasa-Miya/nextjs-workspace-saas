import { describe, it, expect, vi } from 'vitest';

describe('Auth register - bootstrap workspace success (production path)', () => {
  it('201 and runs $transaction without error', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/hash', () => ({ hashPassword: vi.fn(async () => 'hash') }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        user: {
          findUnique: vi.fn(async () => null),
          create: vi.fn(async () => ({ id: 'u123456789', email: 'e@example.com', name: 'N' })),
        },
        $transaction: vi.fn(async (cb: any) => {
          const tx = {
            workspace: { create: vi.fn(async () => ({ id: 'w1' })) },
            membership: { create: vi.fn(async () => ({ id: 'm1' })) },
          } as any;
          return cb(tx);
        }),
      },
    }));
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(new Request('http://test/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'e@example.com', password: 'Password1!', name: 'N' }) }));
    expect(res.status).toBe(201);
  });
});

