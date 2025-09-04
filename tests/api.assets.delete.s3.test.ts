import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
vi.mock('@/src/lib/db', () => ({
  prisma: {
    asset: {
      findUnique: vi.fn(async () => ({ id: 'a1', workspaceId: 'w1', key: 'w1/2024/09/x.png' })),
      delete: vi.fn(async () => ({})),
    },
  },
}));
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({
    send: vi.fn(async () => {
      if ((globalThis as any).__S3_MODE === 'fail') throw new Error('s3 down');
      return { ok: true } as any;
    }),
  })),
  DeleteObjectCommand: vi.fn(() => ({} as any)),
}));

describe('Assets DELETE - S3 paths', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.AWS_REGION = 'ap-northeast-1';
    process.env.S3_BUCKET = 'bucket';
  });

  it('best-effort S3 delete success', async () => {
    (globalThis as any).__S3_MODE = 'ok';
    const { DELETE } = await import('@/app/api/assets/route');
    const res = await DELETE(new Request('http://test/api/assets?id=a1', { method: 'DELETE' }));
    expect(res.status).toBe(200);
  });

  it('best-effort S3 delete failure is ignored', async () => {
    (globalThis as any).__S3_MODE = 'fail';
    const { DELETE } = await import('@/app/api/assets/route');
    const res = await DELETE(new Request('http://test/api/assets?id=a1', { method: 'DELETE' }));
    expect(res.status).toBe(200);
  });
});
