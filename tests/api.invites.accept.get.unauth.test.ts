import { describe, it, expect, vi } from 'vitest';

describe('Invites accept GET - unauthenticated 401', () => {
  it('401 when unauthenticated', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => null) }));
    const { GET } = await import('@/app/api/invites/[token]/accept/route');
    const res = await GET(new Request('http://test/api/invites/abc/accept'), { params: { token: 'abc' } });
    expect(res.status).toBe(401);
  });
});

