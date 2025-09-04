import { describe, it, expect, vi } from 'vitest';

// Default: authenticated; override per-test when needed
vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));

describe('Members GET - authz', () => {
  it('401 when unauthenticated', async () => {
    process.env.NODE_ENV = 'test';
    process.env.AUTH_FORCE_NULL = '1';
    vi.resetModules();
    const { auth } = await import('@/src/lib/auth');
    (auth as any).mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await GET(new Request('http://test/api/workspaces/w1/members'), { params: { id: 'w1' } });
    expect(res.status).toBe(401);
  });

  it('403 when not a member', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.AUTH_FORCE_NULL;
    vi.resetModules();
    const { auth } = await import('@/src/lib/auth');
    (auth as any).mockResolvedValueOnce({ user: { id: 'u' } });
    const { isWorkspaceMember } = await import('@/src/lib/acl');
    (isWorkspaceMember as any).mockResolvedValueOnce(false);
    const { GET } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await GET(new Request('http://test/api/workspaces/w1/members'), { params: { id: 'w1' } });
    expect(res.status).toBe(403);
  });
});
