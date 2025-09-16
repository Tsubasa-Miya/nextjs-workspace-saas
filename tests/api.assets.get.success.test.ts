import { describe, it, expect, vi } from 'vitest';

// Mocks
vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
vi.mock('@/src/lib/db', () => ({ prisma: { asset: { findMany: vi.fn(async () => ([{ id: 'a1' }])) } } }));

describe('Assets GET - success (test payload branch)', () => {
  it('200 and returns list (covers JSON copy branch)', async () => {
    process.env.NODE_ENV = 'test';
    vi.resetModules();
    const { GET } = await import('@/app/api/assets/route');
    const res = await GET(new Request('http://test/api/assets?workspaceId=w1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
  });
});

