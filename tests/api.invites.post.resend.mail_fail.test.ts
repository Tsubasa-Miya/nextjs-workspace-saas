import { describe, it, expect, vi } from 'vitest';

const st = vi.hoisted(() => ({ updatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }));

describe('Invites POST - resend branch mail failure still 200', () => {
  it('200 when resend email fails', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'owner' } })) }));
    vi.mock('@/src/lib/acl', () => ({ requireWorkspaceRole: vi.fn(async () => true) }));
    process.env.APP_BASE_URL = 'http://x';
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        invite: {
          findFirst: vi.fn(async () => ({ id: 'i1', token: 'oldtok' })),
          update: vi.fn(async () => ({ id: 'i1', expiresAt: st.updatedDate })),
        },
      },
    }));
    vi.mock('@/src/lib/email', () => ({ sendEmail: vi.fn(async () => { throw new Error('ses'); }) }));
    vi.mock('@/src/lib/emailTemplates', () => ({ inviteEmailTemplate: () => ({ html: '<p>x</p>', text: 'x' }) }));
    const { POST } = await import('@/app/api/workspaces/[id]/invites/route');
    const req = new Request('http://test/api/workspaces/w1/invites', { method: 'POST', body: JSON.stringify({ email: 'dup@example.com', role: 'Member' }) });
    const res = await POST(req, { params: { id: 'w1' } });
    expect(res.status).toBe(200);
  });
});
