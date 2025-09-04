import { describe, it, expect, vi } from 'vitest';

describe('Workspaces GET - production branch', () => {
  it('returns 200 and lists workspaces', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        membership: {
          findMany: vi.fn(async () => [
            { role: 'Owner', workspace: { id: 'w1', name: 'W1', slug: 'w1' } },
            { role: 'Member', workspace: { id: 'w2', name: 'W2', slug: 'w2' } },
          ]),
        },
      },
    }));
    const { GET } = await import('@/app/api/workspaces/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(2);
  });
});

