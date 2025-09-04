import { describe, it, expect, vi } from 'vitest';

describe('Tasks POST - forbidden 403', () => {
  it('403 when not a member of workspace', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => false) }));
    const { POST } = await import('@/app/api/tasks/route');
    const res = await POST(new Request('http://test/api/tasks', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', title: 'T', status: 'Todo' }) }));
    expect(res.status).toBe(403);
  });
});

