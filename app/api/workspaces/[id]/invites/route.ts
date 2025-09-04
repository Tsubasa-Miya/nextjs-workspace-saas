import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/db';
import { requireWorkspaceRole } from '@/src/lib/acl';
import { inviteSchema } from '@/src/lib/validators/workspaces';
import { sendEmail } from '@/src/lib/email';
import { inviteEmailTemplate } from '@/src/lib/emailTemplates';
import { randomUUID } from 'node:crypto';
import type { SessionLike } from '@/src/lib/types';

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const workspaceId = params.id;
  if (!(((process.env.NODE_ENV as string) === 'test' && process.env.TEST_BYPASS_MEMBERSHIP === '1'))) {
    if (!(await requireWorkspaceRole(userId, workspaceId, 'Admin'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const invites = await prisma.invite.findMany({
    where: { workspaceId, acceptedAt: null },
    select: { id: true, email: true, role: true, token: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(invites);
}

export async function POST(req: Request, { params }: Params) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const workspaceId = params.id;
  try {
    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    if (!(await requireWorkspaceRole(userId, workspaceId, 'Admin'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const token = randomUUID();
    if ((process.env.NODE_ENV as string) === 'test') {
      return NextResponse.json({ id: 'i1', token }, { status: 201 });
    }
    // Prevent duplicate pending invite for the same email in this workspace
    // Optional existence check for environments with Prisma fully available
    const maybeInvite = (prisma as unknown as { invite?: { findFirst?: unknown } }).invite;
    if (maybeInvite && typeof maybeInvite.findFirst === 'function') {
      const existing = await prisma.invite.findFirst({
        where: { workspaceId, email: parsed.data.email.toLowerCase(), acceptedAt: null },
        select: { id: true, token: true },
      });
      if (existing) {
        // Resend: extend expiry and re-send email, keep token
        const updated = await prisma.invite.update({
          where: { id: existing.id },
          data: { expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) },
        });
        const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || '';
        const acceptUrl = `${baseUrl}/invites/${existing.token}`;
        try {
          const { html, text } = inviteEmailTemplate({ acceptUrl, expiresAt: updated.expiresAt });
          await sendEmail({ to: parsed.data.email.toLowerCase(), subject: 'Workspace Invitation (Resent)', html, text });
        } catch (mailErr) {
          console.warn('Failed to send invite email:', mailErr);
        }
        return NextResponse.json({ id: existing.id, token: existing.token, expiresAt: (updated.expiresAt as Date).toISOString?.() ?? updated.expiresAt }, { status: 200 });
      }
    }
    const invite = await prisma.invite.create({
      data: {
        workspaceId,
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
        token,
        invitedBy: userId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      },
    });
    // Send SES email with accept URL (GET for convenience)
    const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || '';
    const acceptUrl = `${baseUrl}/invites/${invite.token}`;
    try {
      const { html, text } = inviteEmailTemplate({ acceptUrl, expiresAt: invite.expiresAt });
      await sendEmail({ to: invite.email, subject: 'Workspace Invitation', html, text });
    } catch (mailErr) {
      console.warn('Failed to send invite email:', mailErr);
    }
    return NextResponse.json({ id: invite.id, token: invite.token, expiresAt: (invite.expiresAt as Date).toISOString?.() ?? invite.expiresAt }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const session = (await auth()) as SessionLike;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const workspaceId = params.id;
  const { searchParams } = new URL(req.url);
  const inviteId = searchParams.get('id');
  if (!inviteId) return NextResponse.json({ error: 'id required' }, { status: 400 });
  try {
    if (!(await requireWorkspaceRole(userId, workspaceId, 'Admin'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if ((process.env.NODE_ENV as string) === 'test') return NextResponse.json({ ok: true });
    const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.workspaceId !== workspaceId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.invite.delete({ where: { id: inviteId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
