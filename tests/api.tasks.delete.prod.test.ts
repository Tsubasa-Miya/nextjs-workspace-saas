import { describe, it, expect, vi } from 'vitest';

describe('Tasks DELETE - production path', () => {
  it('200 when member and task exists', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { task: { findUnique: vi.fn(async () => ({ id: 't1', workspaceId: 'w1' })), delete: vi.fn(async () => ({})) } } }));
    const { DELETE } = await import('@/app/api/tasks/route');
    const res = await DELETE(new Request('http://test/api/tasks?id=t1', { method: 'DELETE' }));
    expect(res.status).toBe(200);
  });
});

