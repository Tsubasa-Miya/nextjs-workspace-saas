import { describe, it, expect, vi } from 'vitest';

describe('Assets sign - 401 when unauthenticated', () => {
  it('401 unauthenticated', async () => {
    process.env.NODE_ENV = 'test';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => null) }));
    const { POST } = await import('@/app/api/assets/sign/route');
    const res = await POST(new Request('http://test/api/assets/sign', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', filename: 'a.png', contentType: 'image/png', size: 10 }) }));
    expect(res.status).toBe(401);
  });
});

