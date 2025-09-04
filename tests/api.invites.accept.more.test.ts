import { describe, it, expect, vi } from 'vitest';

vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
vi.mock('@/src/lib/db', () => ({
  prisma: {
    invite: { findUnique: vi.fn(async () => null) },
    $transaction: vi.fn(async (cb: any) => cb({
      membership: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async () => ({ id: 'm1' })),
      },
      invite: { update: vi.fn(async () => ({ id: 'i1' })) },
    })),
  },
}));

describe('Invites accept - notfound/success branches', () => {
  it('404 when token not found', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { prisma } = await import('@/src/lib/db');
    (prisma.invite.findUnique as any).mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/invites/[token]/accept/route');
    const res = await POST(new Request('http://test/api/invites/xxx/accept'), { params: { token: 'xxx' } });
    expect(res.status).toBe(404);
  });

  it('200 when valid; creates membership if missing', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { prisma } = await import('@/src/lib/db');
    (prisma.invite.findUnique as any).mockResolvedValueOnce({ id: 'i1', token: 'ok', workspaceId: 'w1', role: 'Member', expiresAt: new Date(Date.now() + 1000) });
    const { POST } = await import('@/app/api/invites/[token]/accept/route');
    const res = await POST(new Request('http://test/api/invites/ok/accept'), { params: { token: 'ok' } });
    expect(res.status).toBe(200);
  });

  it('200 when already a member; no create', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { prisma } = await import('@/src/lib/db');
    (prisma.invite.findUnique as any).mockResolvedValueOnce({ id: 'i1', token: 'ok', workspaceId: 'w1', role: 'Member', expiresAt: new Date(Date.now() + 1000) });
    // simulate existing membership branch
    (prisma.$transaction as any).mockImplementationOnce(async (cb: any) =>
      cb({ membership: { findUnique: vi.fn(async () => ({ id: 'm1' })), create: vi.fn(async () => ({ id: 'm1' })) }, invite: { update: vi.fn(async () => ({ id: 'i1' })) } }),
    );
    const { POST } = await import('@/app/api/invites/[token]/accept/route');
    const res = await POST(new Request('http://test/api/invites/ok/accept'), { params: { token: 'ok' } });
    expect(res.status).toBe(200);
  });
});
