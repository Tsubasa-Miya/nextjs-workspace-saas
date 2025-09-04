import { describe, it, expect, vi } from 'vitest';

describe('Assets confirm - prisma error 500', () => {
  it('500 when DB create throws', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AWS_REGION = 'ap-northeast-1';
    process.env.S3_BUCKET = 'bkt';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@aws-sdk/client-s3', () => ({
      S3Client: class { async send() { return { ContentLength: 100, ContentType: 'image/png' }; } },
      HeadObjectCommand: class {},
    }));
    vi.mock('@/src/lib/db', () => ({ prisma: { asset: { create: vi.fn(async () => { throw new Error('db'); }) } } }));
    const { POST } = await import('@/app/api/assets/confirm/route');
    const res = await POST(new Request('http://test/api/assets/confirm', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', key: 'w1/2024/09/a.png', mime: 'image/png', size: 100 }) }));
    expect(res.status).toBe(500);
  });
});

