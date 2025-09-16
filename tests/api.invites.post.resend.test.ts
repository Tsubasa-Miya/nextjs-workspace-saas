import { describe, it, expect, vi } from 'vitest';

const st = vi.hoisted(() => {
  return { updatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) };
});

describe('Invites POST - resend duplicate branch', () => {
  it('200 and re-sends when pending invite exists', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'owner' } })) }));
    vi.mock('@/src/lib/acl', () => ({ requireWorkspaceRole: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        invite: {
          findFirst: vi.fn(async () => ({ id: 'i1', token: 'oldtok' })),
          update: vi.fn(async () => ({ id: 'i1', expiresAt: st.updatedDate })),
        },
      },
    }));
    vi.mock('@/src/lib/email', () => ({ sendEmail: vi.fn(async () => {}) }));
    vi.mock('@/src/lib/emailTemplates', () => ({ inviteEmailTemplate: () => ({ html: '<p>x</p>', text: 'x' }) }));
    const { POST } = await import('@/app/api/workspaces/[id]/invites/route');
    const req = new Request('http://test/api/workspaces/w1/invites', { method: 'POST', body: JSON.stringify({ email: 'dup@example.com', role: 'Member' }) });
    const res = await POST(req, { params: { id: 'w1' } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe('i1');
    expect(json.token).toBe('oldtok');
  });
});
