import { describe, it, expect, vi } from 'vitest';

describe('Assets sign - boundary cases', () => {
  it('400 on size too large (>10MB)', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    const { POST } = await import('@/app/api/assets/sign/route');
    const res = await POST(new Request('http://test/api/assets/sign', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', filename: 'a.png', contentType: 'image/png', size: 11 * 1024 * 1024 }) }));
    expect(res.status).toBe(400);
  });

  it('403 for non-member (production branch)', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AWS_REGION = 'ap-northeast-1';
    process.env.S3_BUCKET = 'bkt';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => false) }));
    const { POST } = await import('@/app/api/assets/sign/route');
    const res = await POST(new Request('http://test/api/assets/sign', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', filename: 'a.png', contentType: 'image/png', size: 1024 }) }));
    expect(res.status).toBe(403);
  });
});

