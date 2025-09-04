import { describe, it, expect, vi } from 'vitest';

describe('Notes GET - workspaceId missing -> 400 (prod)', () => {
  it('400 when workspaceId is missing', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    const { GET } = await import('@/app/api/notes/route');
    const res = await GET(new Request('http://test/api/notes'));
    expect(res.status).toBe(400);
  });
});

