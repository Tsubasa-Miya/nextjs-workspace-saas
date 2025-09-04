import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));

vi.mock('@/src/lib/db', () => ({
  prisma: {
    membership: {
      findMany: vi.fn(async () => [
        { role: 'Owner', user: { id: 'u1', email: 'a@example.com', name: 'A' } },
        { role: 'Member', user: { id: 'u2', email: 'b@example.com', name: null } },
      ]),
    },
  },
}));

import { GET } from '@/app/api/workspaces/[id]/members/route';

describe('Members API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.TEST_USER_ID = 'u1';
    process.env.TEST_BYPASS_MEMBERSHIP = '1';
  });

  it('lists members', async () => {
    const res = await GET(new Request('http://test/api/workspaces/w1/members'), { params: { id: 'w1' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(2);
  });
});
