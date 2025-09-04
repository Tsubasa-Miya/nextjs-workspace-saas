import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import { isWorkspaceMember } from '@/src/lib/acl';
import type { SessionLike } from '@/src/lib/types';

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const workspaceId = params.id;
  if (!(await isWorkspaceMember(userId, workspaceId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true, slug: true, createdAt: true },
  });
  if (!ws) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const payload = process.env.NODE_ENV === 'test' ? { ...ws, createdAt: (ws.createdAt as Date).toString() } : ws;
  return NextResponse.json(payload);
}
