import { describe, it, expect, vi } from 'vitest';

describe('Workspaces POST - 401 when unauthenticated', () => {
  it('401 unauth', async () => {
    process.env.NODE_ENV = 'test';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => null) }));
    const { POST } = await import('@/app/api/workspaces/route');
    const res = await POST(new Request('http://test/api/workspaces', { method: 'POST', body: JSON.stringify({ name: 'N', slug: 's' }) }));
    expect(res.status).toBe(401);
  });
});

