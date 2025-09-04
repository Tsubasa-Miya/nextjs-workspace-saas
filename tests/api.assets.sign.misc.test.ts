import { describe, it, expect, vi } from 'vitest';

describe('Assets sign - misconfig', () => {
  it('500 when S3 not configured', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.AWS_REGION;
    delete process.env.S3_BUCKET;
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    const { POST } = await import('@/app/api/assets/sign/route');
    const res = await POST(new Request('http://test/api/assets/sign', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', filename: 'a.png', contentType: 'image/png', size: 10 }) }));
    expect(res.status).toBe(500);
  });
});

