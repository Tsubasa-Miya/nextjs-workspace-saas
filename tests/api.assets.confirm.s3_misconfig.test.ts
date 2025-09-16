import { describe, it, expect, vi } from 'vitest';

describe('Assets confirm - S3 misconfig returns 500', () => {
  it('500 when S3 not configured (prod path)', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.AWS_REGION;
    delete process.env.S3_BUCKET;
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    const { POST } = await import('@/app/api/assets/confirm/route');
    const body = { workspaceId: 'w1', key: 'w1/2024/09/a.png', mime: 'image/png', size: 10 };
    const res = await POST(new Request('http://test/api/assets/confirm', { method: 'POST', body: JSON.stringify(body) }));
    expect(res.status).toBe(500);
  });
});

