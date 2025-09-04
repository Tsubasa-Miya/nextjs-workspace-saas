import { describe, it, expect, vi } from 'vitest';

describe('Notes DELETE - production path', () => {
  it('200 when member and note exists', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { note: { findUnique: vi.fn(async () => ({ id: 'n1', workspaceId: 'w1' })), delete: vi.fn(async () => ({})) } } }));
    const { DELETE } = await import('@/app/api/notes/route');
    const res = await DELETE(new Request('http://test/api/notes?id=n1', { method: 'DELETE' }));
    expect(res.status).toBe(200);
  });
});

