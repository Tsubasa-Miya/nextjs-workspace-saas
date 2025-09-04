import { describe, it, expect, vi } from 'vitest';

describe('Notes PATCH - response content', () => {
  it('returns updated body and tags', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'me' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        note: {
          findUnique: vi.fn(async () => ({ id: 'n1', workspaceId: 'w1' })),
          update: vi.fn(async (_args: any) => ({ id: 'n1', body: 'B2', tags: ['x','y'] })),
        },
      },
    }));
    const { PATCH } = await import('@/app/api/notes/route');
    const res = await PATCH(new Request('http://test/api/notes', { method: 'PATCH', body: JSON.stringify({ id: 'n1', body: 'B2', tags: ['x','y'] }) }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.body).toBe('B2');
    expect(Array.isArray(data.tags)).toBe(true);
  });
});

