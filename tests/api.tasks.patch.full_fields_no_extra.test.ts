import { describe, it, expect, vi } from 'vitest';

describe('Tasks PATCH - full fields, ignore unknown keys', () => {
  it('omits unknown keys from update payload', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        task: {
          findUnique: vi.fn(async () => ({ id: 't1', workspaceId: 'w1' })),
          update: vi.fn(async (args: any) => ({ id: 't1', ...args.data })),
        },
      },
    }));
    const { PATCH } = await import('@/app/api/tasks/route');
    const dueAt = new Date().toISOString();
    const body = { id: 't1', title: 'T', description: 'D', status: 'Done', assigneeId: 'u2', dueAt, foo: 'bar' } as any;
    const res = await PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify(body) }));
    expect(res.status).toBe(200);
    const { prisma } = await import('@/src/lib/db');
    const call = (prisma.task.update as any).mock.calls[0][0];
    expect(call.data.foo).toBeUndefined();
  });
});

