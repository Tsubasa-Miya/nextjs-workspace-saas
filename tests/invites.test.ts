import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('@/src/lib/email', () => ({ sendEmail: vi.fn(async () => {}) }));

vi.mock('@/src/lib/db', () => ({
  prisma: {
    invite: {
      create: vi.fn(async (args: any) => ({ id: 'i1', token: args.data.token, email: args.data.email, role: args.data.role, expiresAt: args.data.expiresAt })),
      findUnique: vi.fn(async (args: any) => (args.where.token === 'good' ? { id: 'i1', token: 'good', workspaceId: 'w1', role: 'Member', expiresAt: new Date(Date.now() + 3_600_000), invitedBy: 'u1' } : null)),
      update: vi.fn(async () => ({})),
    },
    membership: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async () => ({ id: 'm1' })),
    },
    $transaction: vi.fn(async (cb: any) => cb({ invite: (await import('@/src/lib/db')).prisma.invite, membership: (await import('@/src/lib/db')).prisma.membership })),
  },
}));

import { GET as GET_INVITES, POST as POST_INVITE } from '@/app/api/workspaces/[id]/invites/route';
import { GET as ACCEPT_GET } from '@/app/api/invites/[token]/accept/route';

describe('Invites API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.TEST_USER_ID = 'u1';
    process.env.TEST_BYPASS_MEMBERSHIP = '1';
  });

  it('creates an invite', async () => {
    const req = new Request('http://test/api/workspaces/w1/invites', { method: 'POST', body: JSON.stringify({ email: 'a@example.com', role: 'Member' }) });
    const res = await POST_INVITE(req, { params: { id: 'w1' } });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.token).toBeTypeOf('string');
  });

  it('accepts an invite via GET', async () => {
    const res = await ACCEPT_GET(new Request('http://test/api/invites/good/accept'), { params: { token: 'good' } });
    expect(res.status).toBe(200);
  });
});
