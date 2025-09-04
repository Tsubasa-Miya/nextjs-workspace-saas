import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/acl', () => ({
  isWorkspaceMember: vi.fn(async () => true),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(async () => 'https://signed.example.com/upload'),
}));

// auth is bypassed in test via TEST_USER_ID

import { POST } from '@/app/api/assets/sign/route';
import { isWorkspaceMember } from '@/src/lib/acl';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

describe('POST /api/assets/sign', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.AWS_REGION = 'ap-northeast-1';
    process.env.S3_BUCKET = 'test-bucket';
    process.env.TEST_USER_ID = 'user-1';
    process.env.TEST_BYPASS_MEMBERSHIP = '1';
  });

  it('rejects disallowed extension', async () => {
    const req = new Request('http://test/api/assets/sign', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: 'w1', filename: 'bad.exe', contentType: 'application/octet-stream', size: 123 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('requires membership', async () => {
    process.env.TEST_BYPASS_MEMBERSHIP = '0';
    (isWorkspaceMember as any).mockResolvedValueOnce(false);
    const req = new Request('http://test/api/assets/sign', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: 'w1', filename: 'a.png', contentType: 'image/png', size: 123 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns signed url', async () => {
    const req = new Request('http://test/api/assets/sign', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: 'w1', filename: 'a.png', contentType: 'image/png', size: 123 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.uploadUrl).toBeTypeOf('string');
  });
});
