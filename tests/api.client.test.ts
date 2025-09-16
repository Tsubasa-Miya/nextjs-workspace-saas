import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setUnauthorizedHandler, setRequestLogger, apiFetch, postJson, patchJson } from '@/src/lib/api';

const okJson = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init });
const errJson = (data: unknown, status = 400) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

describe('api client helpers', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('apiFetch returns ok true with JSON body', async () => {
    const fetchSpy = vi.fn(async () => okJson({ hello: 'world' }));
    vi.stubGlobal('fetch', fetchSpy as any);
    const res = await apiFetch<{ hello: string }>('http://x/test');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.hello).toBe('world');
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('apiFetch handles non-JSON response gracefully', async () => {
    const resp = new Response('plain', { status: 404 });
    vi.stubGlobal('fetch', vi.fn(async () => resp) as any);
    const res = await apiFetch('http://x/test');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe('Operation failed');
  });

  it('calls unauthorized handler on 401 and logs via logger/metrics', async () => {
    const u = vi.fn();
    const logger = vi.fn();
    setUnauthorizedHandler(u);
    setRequestLogger(logger);
    vi.stubGlobal('fetch', vi.fn(async () => errJson({ error: 'nope' }, 401)) as any);
    const res = await apiFetch('http://x/test', { method: 'GET' });
    expect(res.ok).toBe(false);
    expect(u).toHaveBeenCalledWith(401);
    expect(logger).toHaveBeenCalled();
  });

  it('retries on configured retryOn status codes', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(errJson({ error: 'busy' }, 503))
      .mockResolvedValueOnce(okJson({ ok: true }));
    vi.stubGlobal('fetch', fetchSpy as any);
    const res = await apiFetch('http://x/test', { retries: 1, retryDelayMs: 1 });
    expect(res.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('retries on network error then succeeds', async () => {
    const netErr = new Error('network down');
    // First call rejects (non-Abort), second call succeeds
    const fetchSpy = vi
      .fn()
      .mockRejectedValueOnce(netErr)
      .mockResolvedValueOnce(okJson({ ok: true }));
    vi.stubGlobal('fetch', fetchSpy as any);
    const res = await apiFetch('http://x/test', { retries: 1, retryDelayMs: 1 });
    expect(res.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('aborts on timeout and reports error with status 0', async () => {
    vi.useFakeTimers();
    const fetchStub = vi.fn(async (_url: RequestInfo, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const sig = init?.signal as AbortSignal | undefined;
        sig?.addEventListener('abort', () => {
          // Simulate native AbortError
          reject({ name: 'AbortError' });
        });
      });
    });
    vi.stubGlobal('fetch', fetchStub as any);
    const p = apiFetch('http://x/test', { timeoutMs: 10 });
    vi.advanceTimersByTime(20);
    const res = await p;
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(0);
  });

  it('postJson and patchJson set headers and methods correctly', async () => {
    const fetchSpy = vi.fn(async (url: RequestInfo, init?: RequestInit) => {
      expect(init?.headers).toBeTruthy();
      const headers = new Headers(init?.headers as any);
      expect(headers.get('Content-Type')).toBe('application/json');
      if (typeof url === 'string' && url.includes('/post')) {
        expect(init?.method).toBe('POST');
      } else {
        expect(init?.method).toBe('PATCH');
      }
      return okJson({ ok: true });
    });
    vi.stubGlobal('fetch', fetchSpy as any);
    const r1 = await postJson('/post', { a: 1 });
    const r2 = await patchJson('/patch', { b: 2 });
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
