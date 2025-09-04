import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/email', () => ({ sendEmail: vi.fn(async () => {}) }));

vi.mock('@/src/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async (args: any) => (args.where.email === 'has@example.com' ? { id: 'u1', email: 'has@example.com' } : null)),
      update: vi.fn(async () => ({})),
    },
    passwordReset: {
      create: vi.fn(async (args: any) => ({ id: 'p1', token: args.data.token })),
      findUnique: vi.fn(async (args: any) => (args.where.token === 'ok' ? { id: 'p1', userId: 'u1', token: 'ok', expiresAt: new Date(Date.now() + 3_600_000), usedAt: null } : null)),
      update: vi.fn(async () => ({})),
    },
    $transaction: vi.fn(async (cb: any) => cb((await import('@/src/lib/db')).prisma)),
  },
}));

import { POST as RESET_REQUEST } from '@/app/api/auth/reset/route';
import { POST as RESET_CONFIRM } from '@/app/api/auth/reset/confirm/route';

describe('Password Reset API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NODE_ENV = 'test';
  });

  it('returns ok even if user not found', async () => {
    const res = await RESET_REQUEST(new Request('http://test/api/auth/reset', { method: 'POST', body: JSON.stringify({ email: 'none@example.com' }) }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it('creates reset token and returns ok', async () => {
    const res = await RESET_REQUEST(new Request('http://test/api/auth/reset', { method: 'POST', body: JSON.stringify({ email: 'has@example.com' }) }));
    expect(res.status).toBe(200);
  });

  it('confirms reset token and updates password', async () => {
    const res = await RESET_CONFIRM(new Request('http://test/api/auth/reset/confirm', { method: 'POST', body: JSON.stringify({ token: 'ok', password: 'NewPassw0rd!' }) }));
    expect(res.status).toBe(200);
  });
});

