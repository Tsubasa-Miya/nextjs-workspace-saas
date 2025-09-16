import { describe, it, expect, vi } from 'vitest';

describe('Assets confirm - 401 when unauthenticated', () => {
  it('401 unauth', async () => {
    process.env.NODE_ENV = 'test';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => null) }));
    const { POST } = await import('@/app/api/assets/confirm/route');
    const body = { workspaceId: 'w1', key: 'w1/2024/09/a.png', mime: 'image/png', size: 10 };
    const res = await POST(new Request('http://test/api/assets/confirm', { method: 'POST', body: JSON.stringify(body) }));
    expect(res.status).toBe(401);
  });
});

