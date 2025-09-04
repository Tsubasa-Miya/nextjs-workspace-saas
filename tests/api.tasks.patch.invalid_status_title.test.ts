import { describe, it, expect, vi } from 'vitest';

describe('Tasks PATCH - invalid status and long title', () => {
  it('400 on invalid status', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: {} }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    const { PATCH } = await import('@/app/api/tasks/route');
    const res = await PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: 't1', status: 'Invalid' }) }));
    expect(res.status).toBe(400);
  });

  it('400 on too long title (>200)', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/db', () => ({ prisma: {} }));
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    const title = 'x'.repeat(201);
    const { PATCH } = await import('@/app/api/tasks/route');
    const res = await PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: 't1', title }) }));
    expect(res.status).toBe(400);
  });
});
