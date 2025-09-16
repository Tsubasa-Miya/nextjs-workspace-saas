import { describe, it, expect, vi } from 'vitest';

describe('Notes POST - 401 when unauthenticated', () => {
  it('401 unauth', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => null) }));
    const { POST } = await import('@/app/api/notes/route');
    const res = await POST(new Request('http://test/api/notes', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', title: 'T', body: 'B' }) }));
    expect(res.status).toBe(401);
  });
});

