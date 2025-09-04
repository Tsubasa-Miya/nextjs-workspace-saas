import { describe, it, expect, vi } from 'vitest';

describe('Workspaces create - validation and success', () => {
  it('400 when body invalid', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    const { POST } = await import('@/app/api/workspaces/route');
    const res = await POST(new Request('http://test/api/workspaces', { method: 'POST', body: JSON.stringify({}) }));
    expect(res.status).toBe(400);
  });

  it('201 when transaction succeeds', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        $transaction: vi.fn(async (cb: any) => {
          const tx = {
            workspace: { create: vi.fn(async () => ({ id: 'w1', name: 'Name', slug: 'slug' })) },
            membership: { create: vi.fn(async () => ({ id: 'm1' })) },
          };
          return cb(tx);
        }),
      },
    }));
    const { POST } = await import('@/app/api/workspaces/route');
    const res = await POST(new Request('http://test/api/workspaces', { method: 'POST', body: JSON.stringify({ name: 'Name', slug: 'slug' }) }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe('w1');
  });
});

