import { describe, it, expect } from 'vitest';

describe('Healthz route', () => {
  it('GET returns ok', async () => {
    const { GET } = await import('@/app/healthz/route');
    const res = await GET(new Request('http://test/healthz'));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe('ok');
  });
});

