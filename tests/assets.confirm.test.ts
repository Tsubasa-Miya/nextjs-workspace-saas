import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/acl', () => ({
  isWorkspaceMember: vi.fn(async () => true),
}));

// auth is bypassed in test via TEST_USER_ID

vi.mock('@aws-sdk/client-s3', async () => {
  return {
    S3Client: class {
      async send() {
        return { ContentLength: 123, ContentType: 'image/png' };
      }
    },
    HeadObjectCommand: class {},
  } as any;
});

vi.mock('@/src/lib/db', () => ({
  prisma: {
    asset: { create: vi.fn(async (args: any) => ({ id: 'asset-1', ...args.data })) },
  },
}));

import { POST } from '@/app/api/assets/confirm/route';
import { prisma } from '@/src/lib/db';

describe('POST /api/assets/confirm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.AWS_REGION = 'ap-northeast-1';
    process.env.S3_BUCKET = 'test-bucket';
    process.env.TEST_USER_ID = 'user-1';
    process.env.TEST_BYPASS_MEMBERSHIP = '1';
  });

  it('rejects invalid key prefix', async () => {
    const req = new Request('http://test/api/assets/confirm', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: 'w1', key: 'wrong/a.png', mime: 'image/png', size: 123 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('creates asset after verifying s3 object', async () => {
    const req = new Request('http://test/api/assets/confirm', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: 'w1', key: 'w1/2024/09/a.png', mime: 'image/png', size: 123 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe('asset-1');
  });
});
