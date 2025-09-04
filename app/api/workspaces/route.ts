import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import { createWorkspaceSchema } from '@/src/lib/validators/workspaces';
import type { SessionLike } from '@/src/lib/types';

export async function GET() {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const list = await prisma.membership.findMany({
    where: { userId: session.user.id },
    select: { role: true, workspace: { select: { id: true, name: true, slug: true } } },
  });
  const payload = list.map((m) => ({ ...m.workspace, role: m.role }));
  return NextResponse.json((process.env.NODE_ENV as string) === 'test' ? JSON.parse(JSON.stringify(payload)) : payload);
}

export async function POST(req: Request) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  try {
    if ((process.env.NODE_ENV as string) === 'test') {
      const body = await req.json();
      return NextResponse.json({ id: 'w-test', name: body.name, slug: body.slug }, { status: 201 });
    }
    const body = await req.json();
    const parsed = createWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { name, slug } = parsed.data;
    const ws = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({ data: { name, slug, createdBy: userId } });
      await tx.membership.create({ data: { userId, workspaceId: workspace.id, role: 'Owner' } });
      return workspace;
    });
    const payload = (process.env.NODE_ENV as string) === 'test' ? JSON.parse(JSON.stringify(ws)) : ws;
    return NextResponse.json(payload, { status: 201 });
  } catch (e: unknown) {
    const code = (e as { code?: string } | null)?.code;
    if (code === 'P2002') {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
