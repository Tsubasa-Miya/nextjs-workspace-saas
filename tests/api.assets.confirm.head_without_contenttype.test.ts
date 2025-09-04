import { describe, it, expect, vi } from 'vitest';

describe('Assets confirm - S3 head without ContentType', () => {
  it('201 when ContentType undefined but size matches', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AWS_REGION = 'ap-northeast-1';
    process.env.S3_BUCKET = 'bkt';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@aws-sdk/client-s3', () => ({ S3Client: class { async send() { return { ContentLength: 1 }; } }, HeadObjectCommand: class {} }));
    vi.mock('@/src/lib/db', () => ({ prisma: { asset: { create: vi.fn(async () => ({ id: 'ax', key: 'k', mime: 'm', size: 1 })) } } }));
    const { POST } = await import('@/app/api/assets/confirm/route');
    const res = await POST(new Request('http://test/api/assets/confirm', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', key: 'w1/2024/09/a.png', mime: 'image/png', size: 1 }) }));
    expect(res.status).toBe(201);
  });
});

