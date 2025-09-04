import { describe, it, expect, vi } from 'vitest';

describe('Assets sign - extension boundary', () => {
  it('200 when uppercase extension .PNG', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AWS_REGION = 'ap-northeast-1';
    process.env.S3_BUCKET = 'bkt';
    vi.resetModules();
    vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn(async () => 'https://signed.example') }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    const { POST } = await import('@/app/api/assets/sign/route');
    const res = await POST(new Request('http://test/api/assets/sign', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', filename: 'X.PNG', contentType: 'image/png', size: 100 }) }));
    expect(res.status).toBe(200);
  });

  it('400 when unsupported extension .gif', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    const { POST } = await import('@/app/api/assets/sign/route');
    const res = await POST(new Request('http://test/api/assets/sign', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', filename: 'a.gif', contentType: 'image/gif', size: 100 }) }));
    expect(res.status).toBe(400);
  });
});

