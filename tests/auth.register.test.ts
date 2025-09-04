import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/db', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

import { prisma } from '@/src/lib/db';
import { POST } from '@/app/api/auth/register/route';

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 409 if email exists', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', email: 'e@example.com' });
    const req = new Request('http://test/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'e@example.com', password: 'Password1!', name: 'E' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('creates a new user', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({ id: 'u2', email: 'n@example.com', name: 'N' });
    const req = new Request('http://test/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'n@example.com', password: 'Password1!', name: 'N' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe('u2');
  });
});

