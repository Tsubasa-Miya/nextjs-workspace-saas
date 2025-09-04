import { describe, it, expect, vi } from 'vitest';

describe('Workspace GET by id - not found', () => {
  it('404 when workspace not found', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { workspace: { findUnique: vi.fn(async () => null) } } }));
    const { GET } = await import('@/app/api/workspaces/[id]/route');
    const res = await GET(new Request('http://test/api/workspaces/wX'), { params: { id: 'wX' } });
    expect(res.status).toBe(404);
  });
});

