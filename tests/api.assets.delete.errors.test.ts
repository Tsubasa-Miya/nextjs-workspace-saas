import { describe, it, expect, vi } from 'vitest';

// Mock db and auth; adjust per-test return values
vi.mock('@/src/lib/db', () => ({ prisma: { asset: { findUnique: vi.fn(async () => null), delete: vi.fn(async () => ({ id: 'a1' })) } } }));
vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));

describe('Assets DELETE - errors', () => {
  it('400 when id missing', async () => {
    process.env.NODE_ENV = 'test';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    const { DELETE } = await import('@/app/api/assets/route');
    const res = await DELETE(new Request('http://test/api/assets', { method: 'DELETE' }));
    expect(res.status).toBe(400);
  });

  it('404 when asset not found', async () => {
    process.env.NODE_ENV = 'test';
    vi.resetModules();
    const { prisma } = await import('@/src/lib/db');
    (prisma.asset.findUnique as any).mockResolvedValueOnce(null);
    const { auth } = await import('@/src/lib/auth');
    (auth as any).mockResolvedValueOnce({ user: { id: 'u' } });
    const { DELETE } = await import('@/app/api/assets/route');
    const res = await DELETE(new Request('http://test/api/assets?id=a1', { method: 'DELETE' }));
    expect(res.status).toBe(404);
  });

  it('403 when not a member', async () => {
    process.env.NODE_ENV = 'test';
    vi.resetModules();
    const { prisma } = await import('@/src/lib/db');
    (prisma.asset.findUnique as any).mockResolvedValueOnce({ id: 'a1', workspaceId: 'w1' });
    const { auth } = await import('@/src/lib/auth');
    (auth as any).mockResolvedValueOnce({ user: { id: 'u' } });
    const { isWorkspaceMember } = await import('@/src/lib/acl');
    (isWorkspaceMember as any).mockResolvedValueOnce(false);
    const { DELETE } = await import('@/app/api/assets/route');
    const res = await DELETE(new Request('http://test/api/assets?id=a1', { method: 'DELETE' }));
    expect(res.status).toBe(403);
  });
});
