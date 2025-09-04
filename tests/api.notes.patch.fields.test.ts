import { describe, it, expect, vi } from 'vitest';

describe('Notes PATCH - field updates', () => {
  function baseMocks() {
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'uX' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        note: {
          findUnique: vi.fn(async () => ({ id: 'n1', workspaceId: 'w1' })),
          update: vi.fn(async (_args: any) => ({ id: 'n1', workspaceId: 'w1', title: 'T', body: 'B', tags: ['x'] })),
        },
      },
    }));
  }

  it('updates title only', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    baseMocks();
    const { PATCH } = await import('@/app/api/notes/route');
    const res = await PATCH(new Request('http://test/api/notes', { method: 'PATCH', body: JSON.stringify({ id: 'n1', title: 'New' }) }));
    expect(res.status).toBe(200);
  });

  it('400 when tags type invalid', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'uX' } })) }));
    const { PATCH } = await import('@/app/api/notes/route');
    const res = await PATCH(new Request('http://test/api/notes', { method: 'PATCH', body: JSON.stringify({ id: 'n1', tags: 123 }) }));
    expect(res.status).toBe(400);
  });
});

