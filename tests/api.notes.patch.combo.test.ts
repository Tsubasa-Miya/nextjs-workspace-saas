import { describe, it, expect, vi } from 'vitest';

describe('Notes PATCH - combo updates', () => {
  it('200 when updating body and tags', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        note: {
          findUnique: vi.fn(async () => ({ id: 'n1', workspaceId: 'w1' })),
          update: vi.fn(async () => ({ id: 'n1', workspaceId: 'w1', body: 'New body', tags: ['a','b'] })),
        },
      },
    }));
    const { PATCH } = await import('@/app/api/notes/route');
    const res = await PATCH(
      new Request('http://test/api/notes', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'n1', body: 'New body', tags: ['a','b'] }),
      })
    );
    expect(res.status).toBe(200);
  });
});

