import { describe, it, expect, vi } from 'vitest';

describe('Tasks DELETE - forbidden 403', () => {
  it('403 when not a member', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: { task: { findUnique: vi.fn(async () => ({ id: 't1', workspaceId: 'w1' })) } } }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'uX' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => false) }));
    const { DELETE } = await import('@/app/api/tasks/route');
    const res = await DELETE(new Request('http://test/api/tasks?id=t1', { method: 'DELETE' }));
    expect(res.status).toBe(403);
  });
});

