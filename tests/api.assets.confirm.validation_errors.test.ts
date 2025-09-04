import { describe, it, expect, vi } from 'vitest';

describe('Assets confirm - validation errors', () => {
  it('400 when size is 0', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: {} }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    const { POST } = await import('@/app/api/assets/confirm/route');
    const res = await POST(new Request('http://test/api/assets/confirm', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', key: 'w1/2024/09/a.png', mime: 'image/png', size: 0 }) }));
    expect(res.status).toBe(400);
  });

  it('400 when mime is empty', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: {} }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    const { POST } = await import('@/app/api/assets/confirm/route');
    const res = await POST(new Request('http://test/api/assets/confirm', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', key: 'w1/2024/09/a.png', mime: '', size: 10 }) }));
    expect(res.status).toBe(400);
  });
});
