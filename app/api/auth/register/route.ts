import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { hashPassword } from '@/src/lib/hash';
import { registerSchema } from '@/src/lib/validators/auth';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { email, password, name } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email: email.toLowerCase(), name, passwordHash } });

    // Create a default workspace and Owner membership for new users (skip in tests)
    if (process.env.NODE_ENV !== 'test') {
      try {
        const slug = `ws-${user.id.slice(0, 8)}`;
        await prisma.$transaction(async (tx) => {
          const ws = await tx.workspace.create({ data: { name: name || 'My Workspace', slug, createdBy: user.id } });
          await tx.membership.create({ data: { userId: user.id, workspaceId: ws.id, role: 'Owner' } });
        });
      } catch (e) {
        console.error('Post-register workspace bootstrap failed', e);
        // Non-fatal: user was created successfully; allow login to proceed.
      }
    }

    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
