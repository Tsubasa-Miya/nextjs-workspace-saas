import { describe, it, expect, vi } from 'vitest';

describe('Tasks POST - combo create payload transformations', () => {
  it('creates with assigneeId (string) and dueAt (ISO -> Date)', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'uC' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        task: {
          create: vi.fn(async (args: any) => ({ id: 'tC', ...args.data })),
        },
      },
    }));
    const { POST } = await import('@/app/api/tasks/route');
    const dueAt = new Date().toISOString();
    const body = { workspaceId: 'w1', title: 'T', description: 'D', status: 'InProgress', assigneeId: 'u2', dueAt };
    const res = await POST(new Request('http://test/api/tasks', { method: 'POST', body: JSON.stringify(body) }));
    expect(res.status).toBe(201);
    const { prisma } = await import('@/src/lib/db');
    const call = (prisma.task.create as any).mock.calls[0][0];
    expect(call.data.assigneeId).toBe('u2');
    expect(call.data.dueAt).toBeInstanceOf(Date);
    expect(call.data.status).toBe('InProgress');
  });
});

