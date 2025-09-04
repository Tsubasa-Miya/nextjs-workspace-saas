import { describe, it, expect, vi } from 'vitest';

describe('Notes POST - combo create payload', () => {
  it('creates with tags array and returns 201', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'uP' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        note: {
          create: vi.fn(async (args: any) => ({ id: 'nC', ...args.data })),
        },
      },
    }));
    const { POST } = await import('@/app/api/notes/route');
    const body = { workspaceId: 'w1', title: 'T', body: 'B', tags: ['a', 'b'] };
    const res = await POST(new Request('http://test/api/notes', { method: 'POST', body: JSON.stringify(body) }));
    expect(res.status).toBe(201);
    const { prisma } = await import('@/src/lib/db');
    const call = (prisma.note.create as any).mock.calls[0][0];
    expect(call.data.tags).toEqual(['a', 'b']);
  });
});

