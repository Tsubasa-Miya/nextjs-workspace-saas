import { describe, it, expect, vi } from 'vitest';

describe('Notes POST - forbidden 403 (prod)', () => {
  it('403 when not a workspace member', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => false) }));
    const { POST } = await import('@/app/api/notes/route');
    const res = await POST(new Request('http://test/api/notes', { method: 'POST', body: JSON.stringify({ workspaceId: 'w1', title: 'T', body: 'B' }) }));
    expect(res.status).toBe(403);
  });
});

