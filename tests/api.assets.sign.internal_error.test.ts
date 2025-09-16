import { describe, it, expect, vi } from 'vitest';

describe('Assets sign - internal error catch path', () => {
  it('500 when S3 signing throws', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AWS_REGION = 'us-east-1';
    process.env.S3_BUCKET = 'b';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn(async () => { throw new Error('sign'); }) }));
    const { POST } = await import('@/app/api/assets/sign/route');
    const body = { workspaceId: 'w1', filename: 'a.png', contentType: 'image/png', size: 10 };
    const res = await POST(new Request('http://test/api/assets/sign', { method: 'POST', body: JSON.stringify(body) }));
    expect(res.status).toBe(500);
  });
});

