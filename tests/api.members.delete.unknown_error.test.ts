import { describe, it, expect, vi } from 'vitest';

describe('Members DELETE - unexpected error 500', () => {
  it('returns 500 when requireWorkspaceRole throws', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'actor' } })) }));
    vi.mock('@/src/lib/acl', () => ({ requireWorkspaceRole: vi.fn(async () => { throw new Error('boom'); }) }));
    const { DELETE } = await import('@/app/api/workspaces/[id]/members/route');
    const res = await DELETE(new Request('http://test/api/workspaces/w1/members?userId=t1'), { params: { id: 'w1' } });
    expect(res.status).toBe(500);
  });
});

