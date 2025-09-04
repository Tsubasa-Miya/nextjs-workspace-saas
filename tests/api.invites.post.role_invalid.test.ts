import { describe, it, expect, vi } from 'vitest';

describe('Invites POST - invalid role', () => {
  it('400 on invalid role value', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    // Avoid prisma init
    vi.mock('@/src/lib/db', () => ({ prisma: {} }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'owner' } })) }));
    vi.mock('@/src/lib/acl', () => ({ requireWorkspaceRole: vi.fn(async () => true) }));
    const { POST } = await import('@/app/api/workspaces/[id]/invites/route');
    const res = await POST(
      new Request('http://test/api/workspaces/w1/invites', {
        method: 'POST',
        body: JSON.stringify({ email: 'ok@example.com', role: 'Super' }),
      }),
      { params: { id: 'w1' } }
    );
    expect(res.status).toBe(400);
  });
});

