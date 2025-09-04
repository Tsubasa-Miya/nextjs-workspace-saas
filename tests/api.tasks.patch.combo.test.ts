import { describe, it, expect, vi } from 'vitest';

describe('Tasks PATCH - combo updates', () => {
  it('200 when updating title, description and status together', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        task: {
          findUnique: vi.fn(async () => ({ id: 't1', workspaceId: 'w1' })),
          update: vi.fn(async () => ({ id: 't1', workspaceId: 'w1', title: 'New', description: 'Desc', status: 'Done' })),
        },
      },
    }));
    const { PATCH } = await import('@/app/api/tasks/route');
    const res = await PATCH(
      new Request('http://test/api/tasks', {
        method: 'PATCH',
        body: JSON.stringify({ id: 't1', title: 'New', description: 'Desc', status: 'Done' }),
      })
    );
    expect(res.status).toBe(200);
  });
});

