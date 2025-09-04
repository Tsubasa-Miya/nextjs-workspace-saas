import { describe, it, expect, vi } from 'vitest';

describe('Tasks PATCH - 404 when not found', () => {
  it('404 when task id not found', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { task: { findUnique: vi.fn(async () => null) } } }));
    const { PATCH } = await import('@/app/api/tasks/route');
    const res = await PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: 'missing', title: 'X' }) }));
    expect(res.status).toBe(404);
  });
});

