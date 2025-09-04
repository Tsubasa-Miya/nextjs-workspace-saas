import { describe, it, expect, vi } from 'vitest';

describe('Notes PATCH - tags not array invalid', () => {
  it('400 when tags is string', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: {} }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    const { PATCH } = await import('@/app/api/notes/route');
    const res = await PATCH(new Request('http://test/api/notes', { method: 'PATCH', body: JSON.stringify({ id: 'n1', tags: 'not-array' }) }));
    expect(res.status).toBe(400);
  });
});

