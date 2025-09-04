import { describe, it, expect, vi } from 'vitest';

vi.mock('@/src/lib/db', () => ({
  prisma: {
    membership: {
      findUnique: vi.fn(async (args: any) => {
        if (args.where.userId_workspaceId.userId === 'u1') return { role: 'Admin' };
        return null;
      }),
    },
  },
}));

import { isWorkspaceMember, requireWorkspaceRole } from '@/src/lib/acl';

describe('acl utils', () => {
  it('isWorkspaceMember false when no record and no bypass', async () => {
    process.env.NODE_ENV = 'production';
    expect(await isWorkspaceMember('ghost', 'w1')).toBe(false);
  });

  it('requireWorkspaceRole respects ordering', async () => {
    expect(await requireWorkspaceRole('u1', 'w1', 'Member')).toBe(true);
    expect(await requireWorkspaceRole('u1', 'w1', 'Admin')).toBe(true);
    expect(await requireWorkspaceRole('u1', 'w1', 'Owner')).toBe(false);
  });

  it('bypass works in test', async () => {
    process.env.NODE_ENV = 'test';
    process.env.TEST_BYPASS_MEMBERSHIP = '1';
    expect(await isWorkspaceMember('any', 'w1')).toBe(true);
    expect(await requireWorkspaceRole('any', 'w1', 'Owner')).toBe(true);
  });
});

