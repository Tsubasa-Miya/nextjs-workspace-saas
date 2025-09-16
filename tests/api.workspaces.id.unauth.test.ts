import { describe, it, expect, vi } from 'vitest';

vi.mock('@/src/lib/apiAuth', () => ({ getAuth: vi.fn(async () => null) }));

describe('Workspace by id - unauth 401', () => {
  it('returns 401 when no session', async () => {
    process.env.NODE_ENV = 'production';
    const { GET } = await import('@/app/api/workspaces/[id]/route');
    const res = await GET(new Request('http://test/api/workspaces/w1'), { params: { id: 'w1' } });
    expect(res.status).toBe(401);
  });
});

