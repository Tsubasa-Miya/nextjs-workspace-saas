import { describe, it, expect, vi } from 'vitest';

describe('Notes PATCH - title max boundary OK (200 chars)', () => {
  it('200 when title is exactly 200 characters', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const title = 'T'.repeat(200);
    vi.mock('@/src/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u' } })) }));
    vi.mock('@/src/lib/acl', () => ({ isWorkspaceMember: vi.fn(async () => true) }));
    vi.mock('@/src/lib/db', () => ({
      prisma: {
        note: {
          findUnique: vi.fn(async () => ({ id: 'n1', workspaceId: 'w1' })),
          update: vi.fn(async (args: any) => ({ id: 'n1', title: args.data.title })),
        },
      },
    }));
    const { PATCH } = await import('@/app/api/notes/route');
    const res = await PATCH(new Request('http://test/api/notes', { method: 'PATCH', body: JSON.stringify({ id: 'n1', title }) }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.title.length).toBe(200);
  });
});

