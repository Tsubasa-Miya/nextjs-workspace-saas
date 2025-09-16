/* istanbul ignore file */
import { auth } from '@/src/lib/auth';
import { isWorkspaceMember, requireWorkspaceRole } from '@/src/lib/acl';
import { prisma } from '@/src/lib/db';
import { redirect } from 'next/navigation';
import { InviteForm } from '../invite-form';
import { PendingInvitesClient } from '../pending-invites-client';
import { MembersListClient } from '../members-list-client';
import type { SessionLike } from '@/src/lib/types';
import { Card } from '@/src/components/ui/Card';

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
    <div className="stack">
      <h1>Members</h1>
      <Card>
        <MembersListClient
          members={members.map((m) => ({ id: m.user.id, name: m.user.name || '', email: m.user.email || '', role: m.role }))}
          canManage={canInvite}
          workspaceId={workspaceId}
        />
      </Card>
      {canInvite && (
        <section className="stack">
          <h2>Invite</h2>
          <Card>
            <InviteForm workspaceId={workspaceId} />
          </Card>
          <h3>Pending Invites</h3>
          <Card>
            <PendingInvitesClient
              workspaceId={workspaceId}
              invites={invites.map((i) => ({ id: i.id, email: i.email, role: i.role as 'Owner' | 'Admin' | 'Member', expiresAt: i.expiresAt.toISOString(), token: i.token, createdAt: i.createdAt.toISOString() }))}
            />
          </Card>
        </section>
      )}
    </div>
  );
}
