import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/db', () => ({
  prisma: {
    note: {
      findMany: vi.fn(async () => [{ id: 'n1', workspaceId: 'w1', title: 'N', body: 'B', createdAt: new Date().toISOString() }]),
      create: vi.fn(async () => ({ id: 'n2', workspaceId: 'w1', title: 'New', body: 'X', createdAt: new Date().toISOString() })),
      findUnique: vi.fn(async (args: any) => (args.where.id === 'n1' ? { id: 'n1', workspaceId: 'w1' } : null)),
      update: vi.fn(async () => ({ id: 'n1', workspaceId: 'w1', title: 'N2', body: 'B2', createdAt: new Date().toISOString() })),
      delete: vi.fn(async () => ({})),
    },
  },
}));

import { GET, POST, PATCH, DELETE } from '@/app/api/notes/route';

describe('Notes API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.TEST_USER_ID = 'u1';
    process.env.TEST_BYPASS_MEMBERSHIP = '1';
  });

  it('lists notes', async () => {
    const res = await GET(new Request('http://test/api/notes?workspaceId=w1'));
    expect(res.status).toBe(200);
  });

  it('creates note', async () => {
    const res = await POST(new Request('http://test/api/notes', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', title: 'New', body: 'B' }) }));
    expect(res.status).toBe(201);
  });

  it('updates note', async () => {
    const res = await PATCH(new Request('http://test/api/notes', { method: 'PATCH', body: JSON.stringify({ id: 'n1', title: 'N2' }) }));
    expect(res.status).toBe(200);
  });

  it('deletes note', async () => {
    const res = await DELETE(new Request('http://test/api/notes?id=n1', { method: 'DELETE' }));
    expect(res.status).toBe(200);
  });
});
