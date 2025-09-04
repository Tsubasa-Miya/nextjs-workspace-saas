import { describe, it, expect, vi } from 'vitest';

describe('Tasks PATCH - assignee and dueAt', () => {
  it('updates assignee and dueAt (200)', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'uX' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        task: {
          findUnique: vi.fn(async () => ({ id: 't1', workspaceId: 'w1' })),
          update: vi.fn(async () => ({ id: 't1', workspaceId: 'w1', assigneeId: 'uX', dueAt: new Date().toISOString() })),
        },
      },
    }));
    const { PATCH } = await import('@/app/api/tasks/route');
    const due = new Date().toISOString();
    const res = await PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: 't1', assigneeId: 'uX', dueAt: due }) }));
    expect(res.status).toBe(200);
  });
});

