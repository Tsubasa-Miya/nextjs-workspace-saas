import { describe, it, expect, vi } from 'vitest';

describe('Tasks PATCH - no-change when fields omitted', () => {
  it('does not set assigneeId/dueAt when omitted', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        task: {
          findUnique: vi.fn(async () => ({ id: 't1', workspaceId: 'w1' })),
          update: vi.fn(async (_args: any) => ({ id: 't1' })),
        },
      },
    }));
    const { PATCH } = await import('@/app/api/tasks/route');
    const res = await PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: 't1', title: 'Keep' }) }));
    expect(res.status).toBe(200);
    const { prisma } = await import('@/src/lib/db');
    const call = (prisma.task.update as any).mock.calls[0][0];
    expect(call.data.assigneeId).toBeUndefined();
    expect(call.data.dueAt).toBeUndefined();
  });
});
