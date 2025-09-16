import { describe, it, expect, vi } from 'vitest';

describe('Invites GET - authz branches', () => {
  it('401 when unauthenticated', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    // Use existing mock and override the return value for this call
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } }) ) }));
    const { auth } = await import('@/src/lib/auth');
    (auth as any).mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/workspaces/[id]/invites/route');
    const res = await GET(new Request('http://test/api/workspaces/w1/invites'), { params: { id: 'w1' } });
    expect(res.status).toBe(401);
  });

  it('403 when actor is not Admin', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/acl', () => ({ requireWorkspaceRole: vi.fn(async () => false) }));
    const { GET } = await import('@/app/api/workspaces/[id]/invites/route');
    const res = await GET(new Request('http://test/api/workspaces/w1/invites'), { params: { id: 'w1' } });
    expect(res.status).toBe(403);
  });
});
