import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/db', () => ({
  prisma: {
    task: {
      findMany: vi.fn(async () => [{ id: 't1', workspaceId: 'w1', title: 'A', status: 'Todo', createdAt: new Date().toISOString() }]),
      create: vi.fn(async () => ({ id: 't2', workspaceId: 'w1', title: 'B', status: 'Todo', createdAt: new Date().toISOString() })),
      findUnique: vi.fn(async (args: any) => (args.where.id === 't1' ? { id: 't1', workspaceId: 'w1' } : null)),
      update: vi.fn(async () => ({ id: 't1', workspaceId: 'w1', title: 'A', status: 'Done', createdAt: new Date().toISOString() })),
      delete: vi.fn(async () => ({})),
    },
  },
}));

import { GET, POST, PATCH, DELETE } from '@/app/api/tasks/route';

describe('Tasks API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.TEST_USER_ID = 'u1';
    process.env.TEST_BYPASS_MEMBERSHIP = '1';
  });

  it('lists tasks in workspace', async () => {
    const res = await GET(new Request('http://test/api/tasks?workspaceId=w1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('creates a task', async () => {
    const req = new Request('http://test/api/tasks', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', title: 'B' }) });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('updates a task', async () => {
    const req = new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: 't1', status: 'Done' }) });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it('deletes a task', async () => {
    const res = await DELETE(new Request('http://test/api/tasks?id=t1'));
    expect(res.status).toBe(200);
  });
});
