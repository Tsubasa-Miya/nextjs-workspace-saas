import { describe, it, expect, vi } from 'vitest';

describe('Notes API - error branches', () => {
  it('400 on POST invalid body', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: {} }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    const { POST } = await import('@/app/api/notes/route');
    const res = await POST(new Request('http://test/api/notes', { method: 'POST', body: JSON.stringify({}) }));
    expect(res.status).toBe(400);
  });

  it('400 on DELETE missing id', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: {} }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    const { DELETE } = await import('@/app/api/notes/route');
    const res = await DELETE(new Request('http://test/api/notes', { method: 'DELETE' }));
    expect(res.status).toBe(400);
  });
});
