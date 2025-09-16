import { apiFetch, postJson, patchJson } from './api';
import type { NoteDTO } from './types';

type InviteResponse = { id: string; token: string; expiresAt?: string };
type WorkspaceResponse = { id: string; name: string; slug: string };
type AssetResponse = { id: string; key: string; mime: string; size: number; createdAt?: string };
type MemberResponse = { id: string; email: string | null; name: string | null; role: 'Owner' | 'Admin' | 'Member' };
type TaskResponse = {
  id: string;
  workspaceId?: string;
  title?: string;
  description?: string | null;
  status: 'Todo' | 'InProgress' | 'Done';
  assigneeId?: string | null;
  createdAt?: string;
  dueAt?: string | null;
};

// Assets
export function assetsSign(body: { workspaceId: string; filename: string; contentType: string; size: number }, init?: Parameters<typeof postJson>[2]) {
  return postJson<{ uploadUrl: string; key: string }>(
    '/api/assets/sign',
    body,
    { retries: 1, timeoutMs: 20000, ...(init || {}) }
  );
}

export function assetsConfirm(body: { workspaceId: string; key: string; mime: string; size: number }, init?: Parameters<typeof postJson>[2]) {
  return postJson<AssetResponse>('/api/assets/confirm', body, { retries: 1, ...(init || {}) });
}

// Invites
export function invitesResend(workspaceId: string, body: { email: string; role: string }, init?: Parameters<typeof postJson>[2]) {
  return postJson<InviteResponse>(`/api/workspaces/${workspaceId}/invites`, body, { retries: 1, ...(init || {}) });
}

export function invitesCancel(workspaceId: string, id: string, init?: Parameters<typeof apiFetch>[1]) {
  return apiFetch<void>(`/api/workspaces/${workspaceId}/invites?id=${encodeURIComponent(id)}`, { method: 'DELETE', ...(init || {}) });
}

export function inviteAccept(token: string, init?: Parameters<typeof apiFetch>[1]) {
  return apiFetch<{ ok: boolean }>(`/api/invites/${token}/accept`, { method: 'GET', retries: 1, ...(init || {}) });
}

// Auth
export function resetConfirm(body: { token: string; password: string }, init?: Parameters<typeof postJson>[2]) {
  return postJson('/api/auth/reset/confirm', body, { timeoutMs: 20000, ...(init || {}) });
}

export function authRegister(body: { email: string; password: string; name?: string }, init?: Parameters<typeof postJson>[2]) {
  return postJson('/api/auth/register', body, init);
}

// Workspaces
export function workspacesCreate(body: { name: string; slug: string }, init?: Parameters<typeof postJson>[2]) {
  return postJson<WorkspaceResponse>('/api/workspaces', body, init);
}

// Members
export function membersPatch(workspaceId: string, body: { userId: string; role: string }, init?: Parameters<typeof patchJson>[2]) {
  return patchJson<MemberResponse>(`/api/workspaces/${workspaceId}/members`, body, init);
}

export function membersDelete(workspaceId: string, userId: string, init?: Parameters<typeof apiFetch>[1]) {
  return apiFetch<void>(`/api/workspaces/${workspaceId}/members?userId=${encodeURIComponent(userId)}`, { method: 'DELETE', ...(init || {}) });
}

// Tasks
export function tasksCreate(body: { workspaceId: string; title: string; description?: string; dueAt?: string }, init?: Parameters<typeof postJson>[2]) {
  return postJson<TaskResponse>('/api/tasks', body, init);
}

export function tasksPatch(body: { id: string; workspaceId: string } & Record<string, unknown>, init?: Parameters<typeof patchJson>[2]) {
  return patchJson<TaskResponse>('/api/tasks', body, init);
}

export function tasksDelete(id: string, init?: Parameters<typeof apiFetch>[1]) {
  return apiFetch<void>(`/api/tasks?id=${encodeURIComponent(id)}`, { method: 'DELETE', ...(init || {}) });
}

// Notes
export function notesCreate(body: { workspaceId: string; title: string; body: string; tags?: string[] }, init?: Parameters<typeof postJson>[2]) {
  return postJson<NoteDTO>('/api/notes', body, init);
}

export function notesPatch(body: { id: string; workspaceId: string } & Record<string, unknown>, init?: Parameters<typeof patchJson>[2]) {
  return patchJson<NoteDTO>('/api/notes', body, init);
}

export function notesDelete(id: string, init?: Parameters<typeof apiFetch>[1]) {
  return apiFetch<void>(`/api/notes?id=${encodeURIComponent(id)}`, { method: 'DELETE', ...(init || {}) });
}
