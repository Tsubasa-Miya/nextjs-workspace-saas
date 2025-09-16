import { describe, it, expect, vi } from 'vitest';

describe('Members PATCH - update throws -> 500', () => {
  it('returns 500 when prisma.membership.update throws', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'actor' } })) }));
    vi.mock('@/src/lib/acl', () => ({ requireWorkspaceRole: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        membership: {
          findUnique: vi.fn(async () => ({ role: 'Member' })),
          count: vi.fn(async () => 2),
          update: vi.fn(async () => { throw new Error('db'); }),
        },
      },
    }));
    const { PATCH } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await PATCH(
      new Request('http://test/api/workspaces/w1/members', { method: 'PATCH', body: JSON.stringify({ userId: 't1', role: 'Admin' }) }),
      { params: { id: 'w1' } }
    );
    expect(res.status).toBe(500);
  });
});

