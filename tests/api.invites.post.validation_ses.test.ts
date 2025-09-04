import { describe, it, expect, vi } from 'vitest';

describe('Invites POST - validation and SES failure', () => {
  it('400 on invalid body', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'owner' } })) }));
    vi.mock('@/src/lib/acl', () => ({ requireWorkspaceRole: vi.fn(async () => true) }));
    const { POST } = await import('@/app/api/workspaces/[id]/invites/route');
    const res = await POST(new Request('http://test/api/workspaces/w1/invites', { method: 'POST', body: JSON.stringify({ email: 'bad-email', role: 'Member' }) }), { params: { id: 'w1' } });
    expect(res.status).toBe(400);
  });

  it('201 even when SES send fails', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'owner' } })) }));
    vi.mock('@/src/lib/acl', () => ({ requireWorkspaceRole: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        invite: { create: vi.fn(async (args: any) => ({ id: 'i1', token: args.data.token, expiresAt: new Date() })) },
      },
    }));
    vi.mock('@/src/lib/email', () => ({ sendEmail: vi.fn(async () => { throw new Error('ses down'); }) }));
    const { POST } = await import('@/app/api/workspaces/[id]/invites/route');
    const res = await POST(new Request('http://test/api/workspaces/w1/invites', { method: 'POST', body: JSON.stringify({ email: 'ok@example.com', role: 'Member' }) }), { params: { id: 'w1' } });
    expect(res.status).toBe(201);
  });
});

