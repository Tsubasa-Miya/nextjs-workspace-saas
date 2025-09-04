import { describe, it, expect, vi } from 'vitest';

describe('Notes PATCH - full fields, ignore unknown keys', () => {
  it('omits unknown keys from update payload', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        note: {
          findUnique: vi.fn(async () => ({ id: 'n1', workspaceId: 'w1' })),
          update: vi.fn(async (args: any) => ({ id: 'n1', ...args.data })),
        },
      },
    }));
    const { PATCH } = await import('@/app/api/notes/route');
    const body = { id: 'n1', title: 'T', body: 'B', tags: ['a'], bar: 'baz' } as any;
    const res = await PATCH(new Request('http://test/api/notes', { method: 'PATCH', body: JSON.stringify(body) }));
    expect(res.status).toBe(200);
    const { prisma } = await import('@/src/lib/db');
    const call = (prisma.note.update as any).mock.calls[0][0];
    expect(call.data.bar).toBeUndefined();
  });
});

