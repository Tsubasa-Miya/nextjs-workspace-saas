import { describe, it, expect, vi } from 'vitest';

const st = vi.hoisted(() => {
  return {
    requireRole: vi.fn(async () => true),
    findUnique: vi.fn(async () => null),
    deleteFn: vi.fn(async () => ({})),
  };
});

vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
vi.mock('@/src/lib/acl', () => ({ requireWorkspaceRole: st.requireRole }));
vi.mock('@/src/lib/db', () => ({ prisma: { invite: { findUnique: st.findUnique, delete: st.deleteFn } } }));

describe('Invites DELETE branches', () => {
  it('403 when actor lacks Admin', async () => {
    process.env.NODE_ENV = 'production';
    st.requireRole.mockResolvedValueOnce(false);
    const { DELETE } = await import('@/app/api/workspaces/[id]/invites/route');
    const res = await DELETE(new Request('http://test/api/workspaces/w1/invites?id=i1'), { params: { id: 'w1' } });
    expect(res.status).toBe(403);
  });

  it('404 when invite not found or mismatched workspace', async () => {
    process.env.NODE_ENV = 'production';
    st.requireRole.mockResolvedValueOnce(true);
    st.findUnique.mockResolvedValueOnce(null);
    const { DELETE } = await import('@/app/api/workspaces/[id]/invites/route');
    const res = await DELETE(new Request('http://test/api/workspaces/w1/invites?id=i1'), { params: { id: 'w1' } });
    expect(res.status).toBe(404);
  });

  it('200 on successful delete', async () => {
    process.env.NODE_ENV = 'production';
    st.requireRole.mockResolvedValueOnce(true);
    st.findUnique.mockResolvedValueOnce({ id: 'i1', workspaceId: 'w1' } as any);
    const { DELETE } = await import('@/app/api/workspaces/[id]/invites/route');
    const res = await DELETE(new Request('http://test/api/workspaces/w1/invites?id=i1'), { params: { id: 'w1' } });
    expect(res.status).toBe(200);
    expect(st.deleteFn).toHaveBeenCalled();
  });

  it('500 on unexpected error', async () => {
    process.env.NODE_ENV = 'production';
    st.requireRole.mockRejectedValueOnce(new Error('boom'));
    const { DELETE } = await import('@/app/api/workspaces/[id]/invites/route');
    const res = await DELETE(new Request('http://test/api/workspaces/w1/invites?id=i1'), { params: { id: 'w1' } });
    expect(res.status).toBe(500);
  });
});
