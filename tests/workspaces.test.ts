import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/db', () => ({
  prisma: {
    membership: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    workspace: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/src/lib/db';
import { GET as GET_WS, POST as POST_WS } from '@/app/api/workspaces/route';
import { GET as GET_ONE } from '@/app/api/workspaces/[id]/route';

describe('Workspaces API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.TEST_USER_ID = 'u1';
    process.env.TEST_BYPASS_MEMBERSHIP = '1';
  });

  it('lists user workspaces', async () => {
    (prisma.membership.findMany as any).mockResolvedValue([
      { role: 'Owner', workspace: { id: 'w1', name: 'W1', slug: 'w1' } },
    ]);
    const res = await GET_WS();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data[0].id).toBe('w1');
  });

  it('creates workspace in transaction', async () => {
    (prisma.$transaction as any).mockImplementation(async (cb: any) => {
      const tx = {
        workspace: { create: vi.fn(async () => ({ id: 'w2', name: 'W2', slug: 'w2' })) },
        membership: { create: vi.fn(async () => ({ id: 'm1' })) },
      };
      return cb(tx);
    });
    const req = new Request('http://test/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name: 'W2', slug: 'w2' }),
    });
    const res = await POST_WS(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(typeof data.id).toBe('string');
  });

  it('gets a workspace by id when member', async () => {
    (prisma.workspace.findUnique as any).mockResolvedValue({ id: 'w1', name: 'W1', slug: 'w1', createdAt: new Date().toISOString() });
    const res = await GET_ONE(new Request('http://test/api/workspaces/w1'), { params: { id: 'w1' } });
    expect(res.status).toBe(200);
  });
});
