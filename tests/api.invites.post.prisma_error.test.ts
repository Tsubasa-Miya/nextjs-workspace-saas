import { describe, it, expect, vi } from 'vitest';

describe('Invites POST - prisma error -> 500', () => {
  it('500 when prisma throws during create', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'admin' } })) }));
    vi.mock('@/src/lib/acl', () => ({ requireWorkspaceRole: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { invite: { create: vi.fn(async () => { throw new Error('db down'); }) } } }));
    const { POST } = await import('@/app/api/workspaces/[id]/invites/route');
    const res = await POST(new Request('http://test/api/workspaces/w1/invites', { method: 'POST', body: JSON.stringify({ email: 'ok@example.com', role: 'Member' }) }), { params: { id: 'w1' } });
    expect(res.status).toBe(500);
  });
});

