import { describe, it, expect, vi } from 'vitest';

describe('Members PATCH - unexpected error 500', () => {
  it('returns 500 when an unknown error is thrown', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'actor' } })) }));
    vi.mock('@/src/lib/acl', () => ({ requireWorkspaceRole: vi.fn(async () => true) }));
    // Throw inside the try block to hit the catch path
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        membership: {
          findUnique: vi.fn(async () => { throw new Error('boom'); }),
        },
      },
    }));
    const { PATCH } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await PATCH(
      new Request('http://test/api/workspaces/w1/members', { method: 'PATCH', body: JSON.stringify({ userId: 't1', role: 'Member' }) }),
      { params: { id: 'w1' } }
    );
    expect(res.status).toBe(500);
  });
});

