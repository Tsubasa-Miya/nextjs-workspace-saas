import { describe, it, expect, vi } from 'vitest';

describe('Invites POST - missing email', () => {
  it('400 when email missing', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: {} }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'owner' } })) }));
    vi.mock('@/src/lib/acl', () => ({ requireWorkspaceRole: vi.fn(async () => true) }));
    const { POST } = await import('@/app/api/workspaces/[id]/invites/route');
    const res = await POST(
      new Request('http://test/api/workspaces/w1/invites', {
        method: 'POST',
        body: JSON.stringify({ role: 'Member' }),
      }),
      { params: { id: 'w1' } }
    );
    expect(res.status).toBe(400);
  });
});

