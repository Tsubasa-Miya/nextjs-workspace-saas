import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }));
vi.mock('@/src/lib/acl', () => ({
  isWorkspaceMember: vi.fn(async () => true),
  requireWorkspaceRole: vi.fn(async () => true),
}));

vi.mock('@/src/lib/db', () => ({
  prisma: {
    task: {
      findMany: vi.fn(async () => []),
      create: vi.fn(async () => ({})),
      findUnique: vi.fn(async () => null),
      update: vi.fn(async () => ({})),
      delete: vi.fn(async () => ({})),
    },
    note: {
      findMany: vi.fn(async () => []),
      create: vi.fn(async () => ({})),
      findUnique: vi.fn(async () => null),
      update: vi.fn(async () => ({})),
      delete: vi.fn(async () => ({})),
    },
    membership: { findMany: vi.fn(async () => []) },
    workspace: { findUnique: vi.fn(async () => ({ id: 'w1', name: 'W1', slug: 'w1', createdAt: new Date() })) },
    $transaction: vi.fn(async (cb: any) => {
      const tx = {
        workspace: { create: vi.fn(async () => ({ id: 'w2', name: 'W2', slug: 'w2' })) },
        membership: { create: vi.fn(async () => ({ id: 'm1' })) },
      };
      return cb(tx);
    }),
  },
}));

import { auth } from '@/src/lib/auth';
import { isWorkspaceMember, requireWorkspaceRole } from '@/src/lib/acl';
import { prisma } from '@/src/lib/db';
import { GET as WS_LIST, POST as WS_CREATE } from '@/app/api/workspaces/route';
import { GET as WS_ONE } from '@/app/api/workspaces/[id]/route';
import { GET as TASKS_GET, POST as TASKS_POST, PATCH as TASKS_PATCH, DELETE as TASKS_DELETE } from '@/app/api/tasks/route';
import { GET as NOTES_GET, POST as NOTES_POST, PATCH as NOTES_PATCH, DELETE as NOTES_DELETE } from '@/app/api/notes/route';
import { POST as INVITES_POST } from '@/app/api/workspaces/[id]/invites/route';

describe('AuthZ and error cases', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.TEST_USER_ID = 'u1';
    process.env.TEST_BYPASS_MEMBERSHIP = '1';
    process.env.AWS_REGION = 'ap-northeast-1';
    process.env.S3_BUCKET = 'bkt';
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (isWorkspaceMember as any).mockResolvedValue(true);
    (requireWorkspaceRole as any).mockResolvedValue(true);
  });

  it('returns 401 when unauthorized (workspaces list)', async () => {
    (auth as any).mockResolvedValueOnce(null);
    const res = await WS_LIST();
    expect(res.status).toBe(401);
  });

  it('workspaces POST returns success in test mode', async () => {
    const req = new Request('http://test/api/workspaces', { method: 'POST', body: JSON.stringify({ name: '' }) });
    const res = await WS_CREATE(req);
    expect(res.status).toBe(201);
  });

  it('returns 403 for workspace detail when not a member', async () => {
    process.env.TEST_BYPASS_MEMBERSHIP = '0';
    (isWorkspaceMember as any).mockResolvedValueOnce(false);
    const res = await WS_ONE(new Request('http://test/api/workspaces/w1'), { params: { id: 'w1' } });
    expect(res.status).toBe(403);
  });

  it('tasks GET requires workspaceId (400)', async () => {
    const res = await TASKS_GET(new Request('http://test/api/tasks'));
    expect(res.status).toBe(400);
  });

  it('tasks GET forbidden when not member (403)', async () => {
    process.env.TEST_BYPASS_MEMBERSHIP = '0';
    (isWorkspaceMember as any).mockResolvedValueOnce(false);
    const res = await TASKS_GET(new Request('http://test/api/tasks?workspaceId=w1'));
    expect(res.status).toBe(403);
  });

  it('tasks POST returns success in test mode even with minimal body', async () => {
    const res = await TASKS_POST(new Request('http://test/api/tasks', { method: 'POST', body: JSON.stringify({}) }));
    expect(res.status).toBe(201);
  });

  it('tasks PATCH returns 200 in test mode', async () => {
    const res = await TASKS_PATCH(new Request('http://test/api/tasks', { method: 'PATCH', body: JSON.stringify({}) }));
    expect(res.status).toBe(200);
  });

  it('tasks DELETE missing id (400)', async () => {
    const res = await TASKS_DELETE(new Request('http://test/api/tasks', { method: 'DELETE' }));
    expect(res.status).toBe(400);
  });

  it('notes GET forbidden (403)', async () => {
    process.env.TEST_BYPASS_MEMBERSHIP = '0';
    (isWorkspaceMember as any).mockResolvedValueOnce(false);
    const res = await NOTES_GET(new Request('http://test/api/notes?workspaceId=w1'));
    expect(res.status).toBe(403);
  });

  it('notes POST returns success in test mode even with minimal body', async () => {
    const res = await NOTES_POST(new Request('http://test/api/notes', { method: 'POST', body: JSON.stringify({}) }));
    expect(res.status).toBe(201);
  });

  it('notes DELETE id missing (400)', async () => {
    const res = await NOTES_DELETE(new Request('http://test/api/notes', { method: 'DELETE' }));
    expect(res.status).toBe(400);
  });

  it('invites POST forbidden when not admin (403)', async () => {
    (requireWorkspaceRole as any).mockResolvedValueOnce(false);
    const req = new Request('http://test/api/workspaces/w1/invites', { method: 'POST', body: JSON.stringify({ email: 'a@b.com', role: 'Member' }) });
    const res = await (await import('@/app/api/workspaces/[id]/invites/route')).POST(req, { params: { id: 'w1' } });
    expect(res.status).toBe(403);
  });
});
