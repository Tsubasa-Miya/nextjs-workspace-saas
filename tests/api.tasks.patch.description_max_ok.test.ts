import { describe, it, expect, vi } from 'vitest';

describe('Tasks PATCH - description max boundary', () => {
  it('200 when description length == 5000', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: { task: { findUnique: vi.fn(async () => ({ id: 't1', workspaceId: 'w1' })), update: vi.fn(async () => ({ id: 't1' })) } } }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    const { PATCH } = await import('@/app/api/tasks/route');
    const description = 'x'.repeat(5000);
    const res = await PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: 't1', description }) }));
    expect(res.status).toBe(200);
  });
});

