import { describe, it, expect, vi } from 'vitest';

describe('Tasks PATCH - field updates', () => {
  function baseMocks() {
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'uX' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        task: {
          findUnique: vi.fn(async () => ({ id: 't1', workspaceId: 'w1' })),
          update: vi.fn(async (_args: any) => ({ id: 't1', workspaceId: 'w1', title: 'T', status: 'InProgress' })),
        },
      },
    }));
  }

  it('updates title only', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    baseMocks();
    const { PATCH } = await import('@/app/api/tasks/route');
    const res = await PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: 't1', title: 'New' }) }));
    expect(res.status).toBe(200);
  });

  it('updates status', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    baseMocks();
    const { PATCH } = await import('@/app/api/tasks/route');
    const res = await PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: 't1', status: 'InProgress' }) }));
    expect(res.status).toBe(200);
  });

  it('400 on invalid dueAt', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'uX' } })) }));
    const { PATCH } = await import('@/app/api/tasks/route');
    const res = await PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: 't1', dueAt: 'not-a-date' }) }));
    expect(res.status).toBe(400);
  });
});

