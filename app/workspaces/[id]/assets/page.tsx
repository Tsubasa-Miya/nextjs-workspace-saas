/* istanbul ignore file */
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import { isWorkspaceMember } from '@/src/lib/acl';
import { redirect } from 'next/navigation';
import { AssetsClient } from '../assets-client';
import type { SessionLike } from '@/src/lib/types';
import { Card } from '@/src/components/ui/Card';

type Params = { params: { id: string } };

export default async function AssetsPage({ params }: Params) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;
  const workspaceId = params.id;
  if (!(await isWorkspaceMember(userId, workspaceId))) redirect('/dashboard');
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!ws) redirect('/dashboard');
  const assetsRaw = await prisma.asset.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } });
  const assets = assetsRaw.map((a) => ({ id: a.id, key: a.key, mime: a.mime, size: a.size, createdAt: a.createdAt.toISOString() }));
  return (
    <div className="stack">
      <h1>{ws.name} — Assets</h1>
      <Card>
        <AssetsClient workspaceId={workspaceId} initialAssets={assets} />
      </Card>
    </div>
  );
}
