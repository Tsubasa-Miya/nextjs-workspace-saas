import { describe, it, expect, vi } from 'vitest';

describe('Invites API - admin authz', () => {
  it('GET returns 403 when not admin', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: { invite: { findMany: vi.fn(async () => []) } } }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/acl', () => ({ requireWorkspaceRole: vi.fn(async () => false) }));
    const { GET } = await import('@/app/api/workspaces/[id]/invites/route');
    const res = await GET(new Request('http://test/api/workspaces/w1/invites'), { params: { id: 'w1' } });
    expect(res.status).toBe(403);
  });
});
