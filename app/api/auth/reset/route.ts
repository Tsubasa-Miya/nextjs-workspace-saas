import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { resetSchema } from '@/src/lib/validators/auth';
import { sendEmail } from '@/src/lib/email';
import { resetEmailTemplate } from '@/src/lib/emailTemplates';
import { randomUUID } from 'node:crypto';

// Placeholder for SES-based password reset flow
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = resetSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    // Prevent user enumeration: always return ok, but only send if user exists
    if (user) {
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
      await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });
      const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || '';
      const link = `${baseUrl}/reset?token=${encodeURIComponent(token)}`;
      try {
        const { html, text } = resetEmailTemplate({ resetUrl: link });
        await sendEmail({ to: user.email, subject: 'Password Reset', html, text });
      } catch (mailErr) {
        console.warn('Failed to send reset email:', mailErr);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
