import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));

vi.mock('@/src/lib/db', () => ({
  prisma: {
    asset: {
      findMany: vi.fn(async () => [{ id: 'a1', workspaceId: 'w1', key: 'w1/2024/09/x.png', mime: 'image/png', size: 10, createdAt: new Date().toISOString() }]),
      findUnique: vi.fn(async (args: any) => (args.where.id === 'a1' ? { id: 'a1', workspaceId: 'w1', key: 'w1/2024/09/x.png' } : null)),
      delete: vi.fn(async () => ({})),
    },
  },
}));

import { GET, DELETE } from '@/app/api/assets/route';

describe('Assets list/delete API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.TEST_USER_ID = 'u1';
    process.env.TEST_BYPASS_MEMBERSHIP = '1';
  });

  it('lists assets for workspace', async () => {
    const res = await GET(new Request('http://test/api/assets?workspaceId=w1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data[0].id).toBe('a1');
  });

  it('deletes asset', async () => {
    const res = await DELETE(new Request('http://test/api/assets?id=a1'));
    expect(res.status).toBe(200);
  });
});
