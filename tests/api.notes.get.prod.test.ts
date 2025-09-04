import { describe, it, expect, vi } from 'vitest';

describe('Notes GET - production path', () => {
  it('lists notes for workspace (non-test branch)', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u-get' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { note: { findMany: vi.fn(async () => [{ id: 'n1' }]) } } }));
    const { GET } = await import('@/app/api/notes/route');
    const res = await GET(new Request('http://test/api/notes?workspaceId=w1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

