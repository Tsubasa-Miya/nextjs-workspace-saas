import { describe, it, expect, vi } from 'vitest';

describe('Assets confirm - extension not allowed', () => {
  it('400 when extension is not in allowlist', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    const { POST } = await import('@/app/api/assets/confirm/route');
    const body = { workspaceId: 'w1', key: 'w1/2024/09/file.exe', mime: 'application/octet-stream', size: 10 };
    const res = await POST(new Request('http://test/api/assets/confirm', { method: 'POST', body: JSON.stringify(body) }));
    expect(res.status).toBe(400);
  });
});

