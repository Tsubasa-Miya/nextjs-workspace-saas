import { describe, it, expect, vi } from 'vitest';

describe('Tasks PATCH - dueAt invalid simple date', () => {
  it('400 when dueAt is YYYY-MM-DD without time', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: {} }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    const { PATCH } = await import('@/app/api/tasks/route');
    const res = await PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: 't1', dueAt: '2024-01-01' }) }));
    expect(res.status).toBe(400);
  });
});

