import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aws-sdk/client-sesv2', () => {
  class SESv2Client {
    async send() { return {}; }
  }
  class SendEmailCommand {}
  return { SESv2Client, SendEmailCommand };
});

describe('email', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.AWS_REGION = 'ap-northeast-1';
  });

  it('throws when MAIL_FROM not configured', async () => {
    delete process.env.MAIL_FROM;
    const { sendEmail } = await import('@/src/lib/email');
    await expect(sendEmail({ to: 'x@example.com', subject: 's', html: '<p>hi</p>' })).rejects.toThrow();
  });

  it('sends when MAIL_FROM configured', async () => {
    process.env.MAIL_FROM = 'no-reply@example.com';
    vi.resetModules();
    const { sendEmail } = await import('@/src/lib/email');
    await expect(sendEmail({ to: 'x@example.com', subject: 's', html: '<p>hi</p>' })).resolves.toBeUndefined();
  });
});
