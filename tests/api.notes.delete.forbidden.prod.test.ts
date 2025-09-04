import { describe, it, expect, vi } from 'vitest';

describe('Notes DELETE - forbidden 403 (prod)', () => {
  it('403 when not a member of note workspace', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => false) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { note: { findUnique: vi.fn(async () => ({ id: 'n1', workspaceId: 'w1' })) } } }));
    const { DELETE } = await import('@/app/api/notes/route');
    const res = await DELETE(new Request('http://test/api/notes?id=n1', { method: 'DELETE' }));
    expect(res.status).toBe(403);
  });
});

