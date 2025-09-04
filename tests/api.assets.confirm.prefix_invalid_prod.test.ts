import { describe, it, expect, vi } from 'vitest';

describe('Assets confirm - invalid key prefix (prod)', () => {
  it('400 when key does not start with workspaceId/', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: {} }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'me' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    const { POST } = await import('@/app/api/assets/confirm/route');
    const res = await POST(new Request('http://test/api/assets/confirm', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', key: 'wrong/a.png', mime: 'image/png', size: 10 }) }));
    expect(res.status).toBe(400);
  });
});

