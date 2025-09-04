import { describe, it, expect, vi } from 'vitest';

describe('Tasks GET - production path', () => {
  it('lists tasks for workspace', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u-get' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { task: { findMany: vi.fn(async () => [{ id: 't1' }]) } } }));
    const { GET } = await import('@/app/api/tasks/route');
    const res = await GET(new Request('http://test/api/tasks?workspaceId=w1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

