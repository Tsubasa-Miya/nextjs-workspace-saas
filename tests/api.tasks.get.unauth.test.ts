import { describe, it, expect, vi } from 'vitest';

describe('Tasks GET - 401 when unauthenticated', () => {
  it('401 unauthenticated', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => null) }));
    const { GET } = await import('@/app/api/tasks/route');
    const res = await GET(new Request('http://test/api/tasks?workspaceId=w1'));
    expect(res.status).toBe(401);
  });
});

