import { describe, it, expect, vi } from 'vitest';

describe('Notes PATCH - forbidden 403', () => {
  it('403 when not a member of workspace', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'uX' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => false) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { note: { findUnique: vi.fn(async () => ({ id: 'n1', workspaceId: 'w1' })) } } }));
    const { PATCH } = await import('@/app/api/notes/route');
    const res = await PATCH(new Request('http://test/api/notes', { method: 'PATCH', body: JSON.stringify({ id: 'n1', title: 'New' }) }));
    expect(res.status).toBe(403);
  });
});

