import { describe, it, expect, vi } from 'vitest';

describe('Notes DELETE - 401 when unauthenticated', () => {
  it('401 unauth', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => null) }));
    const { DELETE } = await import('@/app/api/notes/route');
    const res = await DELETE(new Request('http://test/api/notes?id=n1', { method: 'DELETE' }));
    expect(res.status).toBe(401);
  });
});

