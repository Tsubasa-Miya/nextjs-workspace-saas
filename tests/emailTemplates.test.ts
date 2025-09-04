import { describe, it, expect } from 'vitest';
import { inviteEmailTemplate, resetEmailTemplate } from '@/src/lib/emailTemplates';

describe('email templates', () => {
  it('invite template contains link and date', () => {
    const { html, text } = inviteEmailTemplate({ acceptUrl: 'https://x.test', expiresAt: new Date('2030-01-01T00:00:00Z') });
    expect(html).toContain('https://x.test');
    expect(text).toContain('https://x.test');
  });

  it('reset template contains link', () => {
    const { html, text } = resetEmailTemplate({ resetUrl: 'https://y.test' });
    expect(html).toContain('https://y.test');
    expect(text).toContain('https://y.test');
  });
});

