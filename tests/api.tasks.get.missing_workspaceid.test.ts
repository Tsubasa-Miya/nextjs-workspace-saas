import { describe, it, expect, vi } from 'vitest';

describe('Tasks GET - workspaceId missing -> 400', () => {
  it('400 when workspaceId missing', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    const { GET } = await import('@/app/api/tasks/route');
    const res = await GET(new Request('http://test/api/tasks'));
    expect(res.status).toBe(400);
  });
});

