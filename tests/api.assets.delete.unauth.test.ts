import { describe, it, expect, vi } from 'vitest';

describe('Assets DELETE - 401 when unauthenticated', () => {
  it('401 unauthenticated', async () => {
    process.env.NODE_ENV = 'test';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => null) }));
    const { DELETE } = await import('@/app/api/assets/route');
    const res = await DELETE(new Request('http://test/api/assets?id=a1', { method: 'DELETE' }));
    expect(res.status).toBe(401);
  });
});

