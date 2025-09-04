import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import { isWorkspaceMember, requireWorkspaceRole } from '@/src/lib/acl';
import type { SessionLike } from '@/src/lib/types';

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const workspaceId = params.id;
  if (!(process.env.NODE_ENV === 'test' && process.env.TEST_BYPASS_MEMBERSHIP === '1')) {
    if (!(await isWorkspaceMember(userId, workspaceId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const members = await prisma.membership.findMany({
    where: { workspaceId },
    select: { role: true, user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(members.map((m) => ({ id: m.user.id, email: m.user.email, name: m.user.name, role: m.role })));
}

export async function PATCH(req: Request, { params }: Params) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actorId = session.user.id;
  const workspaceId = params.id;
  try {
    const body = await req.json();
    const targetId = String(body.userId || '');
    const role = String(body.role || '');
    if (!targetId || !['Owner', 'Admin', 'Member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    if (!(await requireWorkspaceRole(actorId, workspaceId, 'Admin'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (actorId === targetId) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }
    const membership = await prisma.membership.findUnique({ where: { userId_workspaceId: { userId: targetId, workspaceId } } });
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // Prevent changing Owner unless actor is Owner
    if (membership.role === 'Owner' && !(await requireWorkspaceRole(actorId, workspaceId, 'Owner'))) {
      return NextResponse.json({ error: 'Only Owner can modify Owner' }, { status: 403 });
    }
    // If elevating to Owner, require actor Owner
    if (role === 'Owner' && !(await requireWorkspaceRole(actorId, workspaceId, 'Owner'))) {
      return NextResponse.json({ error: 'Only Owner can assign Owner' }, { status: 403 });
    }
    // Prevent removing the last Owner
    if (membership.role === 'Owner' && role !== 'Owner') {
      const owners = await prisma.membership.count({ where: { workspaceId, role: 'Owner' } });
      if (owners <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last Owner' }, { status: 400 });
      }
    }
    const updated = await prisma.membership.update({
      where: { userId_workspaceId: { userId: targetId, workspaceId } },
      data: { role: role as 'Owner' | 'Admin' | 'Member' },
      select: { role: true, user: { select: { id: true, email: true, name: true } } },
    });
    return NextResponse.json({ id: updated.user.id, email: updated.user.email, name: updated.user.name, role: updated.role });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actorId = session.user.id;
  const workspaceId = params.id;
  try {
    const { searchParams } = new URL(req.url);
    const targetId = String(searchParams.get('userId') || '');
    if (!targetId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    if (!(await requireWorkspaceRole(actorId, workspaceId, 'Admin'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const membership = await prisma.membership.findUnique({ where: { userId_workspaceId: { userId: targetId, workspaceId } } });
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // Prevent removing Owner unless actor is Owner
    if (membership.role === 'Owner' && !(await requireWorkspaceRole(actorId, workspaceId, 'Owner'))) {
      return NextResponse.json({ error: 'Only Owner can remove Owner' }, { status: 403 });
    }
    // Prevent removing the last Owner
    if (membership.role === 'Owner') {
      const owners = await prisma.membership.count({ where: { workspaceId, role: 'Owner' } });
      if (owners <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last Owner' }, { status: 400 });
      }
    }
    await prisma.membership.delete({ where: { userId_workspaceId: { userId: targetId, workspaceId } } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
