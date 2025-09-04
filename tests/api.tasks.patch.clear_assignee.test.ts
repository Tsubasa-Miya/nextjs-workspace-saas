import { describe, it, expect, vi } from 'vitest';

describe('Tasks PATCH - clear assignee', () => {
  it('sets assigneeId to null when empty string provided', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'me' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { task: { findUnique: vi.fn(async () => ({ id: 't1', workspaceId: 'w1' })), update: vi.fn(async (args: any) => ({ id: 't1', assigneeId: args.data.assigneeId })) } } }));
    const { PATCH } = await import('@/app/api/tasks/route');
    const res = await PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: 't1', assigneeId: '' }) }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.assigneeId).toBeNull();
  });
});
