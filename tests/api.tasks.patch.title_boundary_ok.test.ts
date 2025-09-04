import { describe, it, expect, vi } from 'vitest';

describe('Tasks PATCH - title boundary ok (200 chars)', () => {
  it('200 when title length == 200', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({ prisma: { task: { findUnique: vi.fn(async () => ({ id: 't1', workspaceId: 'w1' })), update: vi.fn(async () => ({ id: 't1' })) } } }));
    const { PATCH } = await import('@/app/api/tasks/route');
    const title = 'x'.repeat(200);
    const res = await PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: 't1', title }) }));
    expect(res.status).toBe(200);
  });
});

