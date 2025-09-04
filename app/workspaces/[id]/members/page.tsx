/* istanbul ignore file */
import { auth } from '@/src/lib/auth';
import { isWorkspaceMember, requireWorkspaceRole } from '@/src/lib/acl';
import { prisma } from '@/src/lib/db';
import { redirect } from 'next/navigation';
import { InviteForm } from '../invite-form';
import { PendingInvitesClient } from '../pending-invites-client';
import { MembersListClient } from '../members-list-client';
import type { SessionLike } from '@/src/lib/types';

type Params = { params: { id: string } };

export default async function MembersPage({ params }: Params) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;
  const workspaceId = params.id;
  if (!(await isWorkspaceMember(userId, workspaceId))) redirect('/dashboard');

  const members = await prisma.membership.findMany({
    where: { workspaceId },
    select: { role: true, user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const canInvite = await requireWorkspaceRole(userId, workspaceId, 'Admin');
  const invites = canInvite
    ? await prisma.invite.findMany({ where: { workspaceId, acceptedAt: null }, orderBy: { createdAt: 'desc' } })
    : [];

  return (
    <main style={{ padding: 24 }}>
      <h1>Members</h1>
      <p style={{ marginTop: 8 }}>
        <a href="/dashboard">Back to Dashboard</a> | <a href={`/workspaces/${workspaceId}`}>Overview</a> | <a href={`/workspaces/${workspaceId}/notes`}>Notes</a> | <a href={`/workspaces/${workspaceId}/members`}>Members</a> | <a href={`/workspaces/${workspaceId}/assets`}>Assets</a>
      </p>
      <MembersListClient
        members={members.map((m) => ({ id: m.user.id, name: m.user.name || '', email: m.user.email || '', role: m.role }))}
        canManage={canInvite}
        workspaceId={workspaceId}
      />
      {canInvite && (
        <section style={{ marginTop: 24 }}>
          <h2>Invite</h2>
          <InviteForm workspaceId={workspaceId} />
          <h3 style={{ marginTop: 12 }}>Pending Invites</h3>
          <PendingInvitesClient
            workspaceId={workspaceId}
            invites={invites.map((i) => ({ id: i.id, email: i.email, role: i.role as 'Owner' | 'Admin' | 'Member', expiresAt: i.expiresAt.toISOString(), token: i.token, createdAt: i.createdAt.toISOString() }))}
          />
        </section>
      )}
    </main>
  );
}
