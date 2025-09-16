import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/api', () => ({
  postJson: vi.fn(async (_url: string, _body: any) => ({ ok: true, data: { ok: true }, status: 200 })),
  patchJson: vi.fn(async (_url: string, _body: any) => ({ ok: true, data: { ok: true }, status: 200 })),
  apiFetch: vi.fn(async (_url: string, _init?: RequestInit) => ({ ok: true, data: undefined, status: 200 })),
}));

import {
  assetsSign,
  assetsConfirm,
  invitesResend,
  invitesCancel,
  inviteAccept,
  resetConfirm,
  authRegister,
  workspacesCreate,
  membersPatch,
  membersDelete,
  tasksCreate,
  tasksPatch,
  tasksDelete,
  notesCreate,
  notesPatch,
  notesDelete,
} from '@/src/lib/apiPresets';
import { postJson, patchJson, apiFetch } from '@/src/lib/api';

describe('apiPresets wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assetsSign and assetsConfirm call postJson with expected URLs', async () => {
    await assetsSign({ workspaceId: 'w', filename: 'f', contentType: 'c', size: 1 });
    await assetsConfirm({ workspaceId: 'w', key: 'k', mime: 'm', size: 2 });
    expect(postJson).toHaveBeenCalledWith('/api/assets/sign', expect.any(Object), expect.any(Object));
    expect(postJson).toHaveBeenCalledWith('/api/assets/confirm', expect.any(Object), expect.any(Object));
  });

  it('invites wrappers call correct endpoints with workspaceId', async () => {
    await invitesResend('w1', { email: 'a@b', role: 'viewer' });
    await invitesCancel('w2', 'id-1');
    expect(postJson).toHaveBeenCalledWith('/api/workspaces/w1/invites', expect.any(Object), expect.any(Object));
    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/w2/invites?id=id-1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('inviteAccept uses GET on tokenized URL', async () => {
    await inviteAccept('tok');
    expect(apiFetch).toHaveBeenCalledWith('/api/invites/tok/accept', expect.objectContaining({ method: 'GET' }));
  });

  it('auth and workspace wrappers call postJson', async () => {
    await resetConfirm({ token: 't', password: 'p' });
    await authRegister({ email: 'e', password: 'p' });
    await workspacesCreate({ name: 'n', slug: 's' });
    expect(postJson).toHaveBeenCalledWith('/api/auth/reset/confirm', expect.any(Object), expect.any(Object));
    expect(postJson).toHaveBeenCalledWith('/api/auth/register', expect.any(Object), undefined as any);
    expect(postJson).toHaveBeenCalledWith('/api/workspaces', expect.any(Object), undefined as any);
  });

  it('membersPatch and membersDelete hit expected endpoints', async () => {
    await membersPatch('w', { userId: 'u', role: 'admin' });
    await membersDelete('w', 'u');
    expect(patchJson).toHaveBeenCalledWith('/api/workspaces/w/members', expect.any(Object), undefined as any);
    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/w/members?userId=u', expect.objectContaining({ method: 'DELETE' }));
  });

  it('tasks and notes wrappers route to correct URLs', async () => {
    await tasksCreate({ workspaceId: 'w', title: 't' });
    await tasksPatch({ id: 'id1', workspaceId: 'w' });
    await tasksDelete('id2');
    await notesCreate({ workspaceId: 'w', title: 't', body: 'b' });
    await notesPatch({ id: 'id3', workspaceId: 'w' });
    await notesDelete('id4');
    expect(postJson).toHaveBeenCalledWith('/api/tasks', expect.any(Object), undefined as any);
    expect(patchJson).toHaveBeenCalledWith('/api/tasks', expect.any(Object), undefined as any);
    expect(apiFetch).toHaveBeenCalledWith('/api/tasks?id=id2', expect.objectContaining({ method: 'DELETE' }));
    expect(postJson).toHaveBeenCalledWith('/api/notes', expect.any(Object), undefined as any);
    expect(patchJson).toHaveBeenCalledWith('/api/notes', expect.any(Object), undefined as any);
    expect(apiFetch).toHaveBeenCalledWith('/api/notes?id=id4', expect.objectContaining({ method: 'DELETE' }));
  });
});
