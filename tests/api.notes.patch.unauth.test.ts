import { describe, it, expect, vi } from 'vitest';

describe('Notes PATCH - 401 when unauthenticated', () => {
  it('401 unauth', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => null) }));
    const { PATCH } = await import('@/app/api/notes/route');
    const res = await PATCH(new Request('http://test/api/notes', { method: 'PATCH', body: JSON.stringify({ id: 'n1', title: 'X' }) }));
    expect(res.status).toBe(401);
  });
});

