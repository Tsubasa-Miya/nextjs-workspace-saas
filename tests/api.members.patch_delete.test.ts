import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared mocks to tweak per test
const st = vi.hoisted(() => {
  return {
    requireRole: vi.fn(async () => true),
    findUnique: vi.fn(async () => null),
    countOwners: vi.fn(async () => 1),
    update: vi.fn(async (_: any) => ({ role: 'Admin', user: { id: 't1', email: 't@example.com', name: 'T' } })),
    del: vi.fn(async () => ({})),
  };
});

vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'actor' } })) }));
vi.mock('@/src/lib/acl', () => ({
  isWorkspaceMember: vi.fn(async () => true),
  requireWorkspaceRole: st.requireRole,
}));
vi.mock('@/src/lib/db', () => ({
  prisma: {
    membership: {
      findUnique: st.findUnique,
      count: st.countOwners,
      update: st.update,
      delete: st.del,
    },
  },
}));

describe('Members PATCH/DELETE branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'production';
    st.requireRole.mockReset();
    st.findUnique.mockReset();
    st.countOwners.mockReset();
    st.update.mockReset();
    st.del.mockReset();
    st.requireRole.mockResolvedValue(true);
  });

  it('PATCH 400 on invalid payload', async () => {
    vi.resetModules();
    const { PATCH } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await PATCH(new Request('http://test/api/workspaces/w1/members', { method: 'PATCH', body: JSON.stringify({}) }), { params: { id: 'w1' } });
    expect(res.status).toBe(400);
  });

  it('PATCH 403 when actor lacks Admin', async () => {
    st.requireRole.mockResolvedValueOnce(false);
    vi.resetModules();
    const { PATCH } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await PATCH(new Request('http://test/api/workspaces/w1/members', { method: 'PATCH', body: JSON.stringify({ userId: 't1', role: 'Member' }) }), { params: { id: 'w1' } });
    expect(res.status).toBe(403);
  });

  it('PATCH 400 when actor tries to change own role', async () => {
    st.requireRole.mockResolvedValueOnce(true);
    vi.resetModules();
    const { PATCH } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await PATCH(new Request('http://test/api/workspaces/w1/members', { method: 'PATCH', body: JSON.stringify({ userId: 'actor', role: 'Member' }) }), { params: { id: 'w1' } });
    expect(res.status).toBe(400);
  });

  it('PATCH 404 when target membership not found', async () => {
    st.requireRole.mockResolvedValueOnce(true);
    st.findUnique.mockResolvedValueOnce(null);
    vi.resetModules();
    const { PATCH } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await PATCH(new Request('http://test/api/workspaces/w1/members', { method: 'PATCH', body: JSON.stringify({ userId: 't1', role: 'Member' }) }), { params: { id: 'w1' } });
    expect(res.status).toBe(404);
  });

  it('PATCH 403 when modifying Owner without Owner rights', async () => {
    st.requireRole.mockResolvedValueOnce(true); // Admin check
    st.findUnique.mockResolvedValueOnce({ role: 'Owner' });
    // Owner modification check will call requireRole again
    st.requireRole.mockResolvedValueOnce(false);
    vi.resetModules();
    const { PATCH } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await PATCH(new Request('http://test/api/workspaces/w1/members', { method: 'PATCH', body: JSON.stringify({ userId: 't1', role: 'Member' }) }), { params: { id: 'w1' } });
    expect(res.status).toBe(403);
  });

  it('PATCH 403 when assigning Owner without Owner rights', async () => {
    st.requireRole.mockResolvedValueOnce(true); // Admin check
    st.findUnique.mockResolvedValueOnce({ role: 'Member' });
    // assigning Owner requires Owner
    st.requireRole.mockResolvedValueOnce(false);
    vi.resetModules();
    const { PATCH } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await PATCH(new Request('http://test/api/workspaces/w1/members', { method: 'PATCH', body: JSON.stringify({ userId: 't1', role: 'Owner' }) }), { params: { id: 'w1' } });
    expect(res.status).toBe(403);
  });

  it('PATCH 400 when attempting to remove the last Owner', async () => {
    st.requireRole.mockResolvedValueOnce(true); // Admin check
    st.findUnique.mockResolvedValueOnce({ role: 'Owner' });
    st.requireRole.mockResolvedValueOnce(true); // Owner modification allowed
    st.countOwners.mockResolvedValueOnce(1);
    vi.resetModules();
    const { PATCH } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await PATCH(new Request('http://test/api/workspaces/w1/members', { method: 'PATCH', body: JSON.stringify({ userId: 't1', role: 'Member' }) }), { params: { id: 'w1' } });
    expect(res.status).toBe(400);
  });

  it('PATCH 200 on successful role update', async () => {
    st.requireRole.mockResolvedValueOnce(true); // Admin check
    st.findUnique.mockResolvedValueOnce({ role: 'Member' });
    st.update.mockResolvedValueOnce({ role: 'Admin', user: { id: 't1', email: 't@example.com', name: 'T' } } as any);
    vi.resetModules();
    const { PATCH } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await PATCH(new Request('http://test/api/workspaces/w1/members', { method: 'PATCH', body: JSON.stringify({ userId: 't1', role: 'Admin' }) }), { params: { id: 'w1' } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.role).toBe('Admin');
  });

  it('DELETE 400 when userId missing', async () => {
    st.requireRole.mockResolvedValueOnce(true);
    vi.resetModules();
    const { DELETE } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await DELETE(new Request('http://test/api/workspaces/w1/members'), { params: { id: 'w1' } });
    expect(res.status).toBe(400);
  });

  it('DELETE 403 when actor lacks Admin', async () => {
    st.requireRole.mockResolvedValue(false);
    const { DELETE } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await DELETE(new Request('http://test/api/workspaces/w1/members?userId=t1'), { params: { id: 'w1' } });
    expect(res.status).toBe(403);
  });

  it('DELETE 404 when membership not found', async () => {
    st.requireRole.mockResolvedValue(true);
    st.findUnique.mockResolvedValueOnce(null);
    const { DELETE } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await DELETE(new Request('http://test/api/workspaces/w1/members?userId=t1'), { params: { id: 'w1' } });
    expect(res.status).toBe(404);
  });

  it('DELETE 403 when removing Owner without Owner rights', async () => {
    st.requireRole.mockResolvedValue(true); // Admin check
    st.findUnique.mockResolvedValueOnce({ role: 'Owner' });
    // next requireRole check (Owner) should be false
    st.requireRole.mockResolvedValueOnce(false);
    const { DELETE } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await DELETE(new Request('http://test/api/workspaces/w1/members?userId=t1'), { params: { id: 'w1' } });
    expect(res.status).toBe(403);
  });

  it('DELETE 400 when attempting to remove the last Owner', async () => {
    st.requireRole.mockResolvedValue(true); // Admin check
    st.findUnique.mockResolvedValueOnce({ role: 'Owner' });
    st.requireRole.mockResolvedValueOnce(true); // Owner removal allowed
    st.countOwners.mockResolvedValueOnce(1);
    const { DELETE } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await DELETE(new Request('http://test/api/workspaces/w1/members?userId=t1'), { params: { id: 'w1' } });
    expect(res.status).toBe(400);
  });

  it('DELETE 200 on success', async () => {
    st.requireRole.mockResolvedValue(true); // Admin check
    st.findUnique.mockResolvedValueOnce({ role: 'Member' });
    st.countOwners.mockResolvedValue(2);
    st.del.mockResolvedValueOnce({});
    const { DELETE } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await DELETE(new Request('http://test/api/workspaces/w1/members?userId=t1'), { params: { id: 'w1' } });
    expect(res.status).toBe(200);
  });
});
