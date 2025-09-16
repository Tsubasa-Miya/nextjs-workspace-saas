import { describe, it, expect, vi } from 'vitest';

describe('Workspace by id route branches', () => {
  it('200 and stringifies createdAt in test env', async () => {
    process.env.NODE_ENV = 'test';
    vi.resetModules();
    vi.mock('@/src/lib/apiAuth', () => ({ getAuth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { workspace: { findUnique: vi.fn(async () => ({ id: 'w1', name: 'W', slug: 'w', createdAt: new Date() })) } } }));
    const { GET } = await import('@/app/api/workspaces/[id]/route');
    const res = await GET(new Request('http://test/api/workspaces/w1'), { params: { id: 'w1' } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.createdAt).toBe('string');
  });
});
