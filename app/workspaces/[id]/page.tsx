/* istanbul ignore file */
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import { isWorkspaceMember } from '@/src/lib/acl';
import { redirect } from 'next/navigation';
import { TasksClient } from './tasks-client';
import type { SessionLike } from '@/src/lib/types';

type Params = { params: { id: string } };

export default async function WorkspacePage({ params }: Params) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;
  const workspaceId = params.id;

  if (!(await isWorkspaceMember(userId, workspaceId))) redirect('/dashboard');

  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!ws) redirect('/dashboard');

  const tasksRaw = await prisma.task.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } });
  const tasks = tasksRaw.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? null,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    assigneeId: t.assigneeId ?? null,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
  }));
  const members = await prisma.membership.findMany({
    where: { workspaceId },
    select: { role: true, user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <main style={{ padding: 24 }}>
      <h1>{ws.name}</h1>
      <p style={{ marginTop: 8 }}>
        <a href="/dashboard">Back to Dashboard</a> | <a href={`/workspaces/${workspaceId}`}>Overview</a> | <a href={`/workspaces/${workspaceId}/notes`}>Notes</a> | <a href={`/workspaces/${workspaceId}/members`}>Members</a> | <a href={`/workspaces/${workspaceId}/assets`}>Assets</a>
      </p>
      <h2 style={{ marginTop: 16 }}>Tasks</h2>
      <TasksClient
        workspaceId={workspaceId}
        initialTasks={tasks}
        members={members.map((m) => ({ id: m.user.id, label: m.user.name || m.user.email || m.user.id }))}
        currentUserId={userId}
      />
    </main>
  );
}
