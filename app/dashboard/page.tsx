/* istanbul ignore file */
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspaceCreateForm } from './workspace-create-form';
import { WorkspacesListClient } from './workspaces-list-client';
import type { SessionLike } from '@/src/lib/types';

export default async function DashboardPage() {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const memberships = await prisma.membership.findMany({
    where: { userId },
    select: { role: true, workspace: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const items = memberships.map((m) => ({ id: m.workspace.id, name: m.workspace.name, slug: m.workspace.slug, role: m.role }));

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <section style={{ marginTop: 16 }}>
        <h2>Your Workspaces</h2>
        <WorkspacesListClient items={items} />
      </section>
      <section style={{ marginTop: 24 }}>
        <h2>Create Workspace</h2>
        <WorkspaceCreateForm />
      </section>
    </main>
  );
}
