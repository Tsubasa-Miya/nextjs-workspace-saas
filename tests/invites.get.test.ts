import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/acl', () => ({ requireWorkspaceRole: vi.fn(async () => true) }));

vi.mock('@/src/lib/db', () => ({
  prisma: {
    invite: {
      findMany: vi.fn(async () => [{ id: 'i1', email: 'e@example.com', role: 'Member', token: 't', expiresAt: new Date(), createdAt: new Date() }]),
    },
  },
}));

import { GET } from '@/app/api/workspaces/[id]/invites/route';

describe('Invites GET API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.TEST_USER_ID = 'u1';
    process.env.TEST_BYPASS_MEMBERSHIP = '1';
  });

  it('lists invites', async () => {
    const res = await GET(new Request('http://test/api/workspaces/w1/invites'), { params: { id: 'w1' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data[0].id).toBe('i1');
  });
});
