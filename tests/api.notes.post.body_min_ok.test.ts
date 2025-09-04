import { describe, it, expect, vi } from 'vitest';

describe('Notes POST - body min boundary ok (1 char)', () => {
  it('201 when body is exactly 1 character', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'uN' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { note: { create: vi.fn(async (args: any) => ({ id: 'n1', ...args.data })) } } }));
    const { POST } = await import('@/app/api/notes/route');
    const res = await POST(new Request('http://test/api/notes', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', title: 'T', body: 'a' }) }));
    expect(res.status).toBe(201);
  });
});

