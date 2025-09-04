import { describe, it, expect, vi } from 'vitest';

// Default mocks for POST
vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u-post' } })) }));
vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
vi.mock('@/src/lib/db', () => ({ prisma: { task: { create: vi.fn(async () => ({ id: 't2', workspaceId: 'w1', title: 'T' })) } } }));

describe('Tasks POST - production path', () => {
  it('201 when valid and member', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { POST } = await import('@/app/api/tasks/route');
    const res = await POST(new Request('http://test/api/tasks', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', title: 'T', status: 'Todo' }) }));
    expect(res.status).toBe(201);
  });

  it('500 when prisma throws', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { prisma } = await import('@/src/lib/db');
    (prisma.task.create as any).mockImplementationOnce(async () => { throw new Error('db'); });
    const { POST } = await import('@/app/api/tasks/route');
    const res = await POST(new Request('http://test/api/tasks', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', title: 'T', status: 'Todo' }) }));
    expect(res.status).toBe(500);
  });
});

