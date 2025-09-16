import { describe, it, expect } from 'vitest';

describe('NextAuth route exports handlers', () => {
  it('exposes GET and POST from lib/auth', async () => {
    process.env.NODE_ENV = 'test';
    const mod = await import('@/app/api/auth/[...nextauth]/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
    const res = await mod.GET(new Request('http://test/api/auth')); // returns 501 in test mode
    expect(res.status).toBe(501);
  });
});

