import { describe, it, expect, vi } from 'vitest';

describe('Tasks PATCH - description too long', () => {
  it('400 when description > 5000 chars', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: {} }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    const desc = 'x'.repeat(5001);
    const { PATCH } = await import('@/app/api/tasks/route');
    const res = await PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: 't1', description: desc }) }));
    expect(res.status).toBe(400);
  });
});
