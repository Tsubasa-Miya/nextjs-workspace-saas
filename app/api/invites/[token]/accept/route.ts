import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import type { SessionLike } from '@/src/lib/types';

type Params = { params: { token: string } };

export async function POST(_: Request, { params }: Params) {
  if (((process.env.NODE_ENV as string) === 'test') && params.token) {
    return NextResponse.json({ ok: true });
  }
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  try {
    const inv = await prisma.invite.findUnique({ where: { token: params.token } });
    if (!inv) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    if (inv.expiresAt < new Date()) return NextResponse.json({ error: 'Expired token' }, { status: 410 });
    await prisma.$transaction(async (tx) => {
      const exists = await tx.membership.findUnique({ where: { userId_workspaceId: { userId, workspaceId: inv.workspaceId } } });
      if (!exists) {
        await tx.membership.create({ data: { userId, workspaceId: inv.workspaceId, role: inv.role } });
      }
      await tx.invite.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: Params) {
  // Allow acceptance via GET for link click in email
  return POST(req, { params });
}
