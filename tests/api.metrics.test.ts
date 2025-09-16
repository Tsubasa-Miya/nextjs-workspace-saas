import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordMetric,
  getMetricsSnapshot,
  onMetrics,
  resetMetrics,
  exportMetricsJSON,
  importMetricsJSON,
  setMetricsPaused,
  isMetricsPaused,
  resetEndpoint,
} from '@/src/lib/apiMetrics';

describe('apiMetrics', () => {
  beforeEach(() => {
    setMetricsPaused(false);
    resetMetrics();
  });

  it('records success and error, by status and per endpoint', () => {
    const events: any[] = [];
    const off = onMetrics((s) => events.push(s.total));
    recordMetric({ url: '/api/x?foo=1', method: 'GET', status: 200, ok: true, durationMs: 50 });
    recordMetric({ url: new URL('https://example.com/api/x?bar=2'), method: 'get', status: 500, ok: false, durationMs: 30 });
    off();
    const s = getMetricsSnapshot();
    expect(s.total).toBe(2);
    expect(s.success).toBe(1);
    expect(s.error).toBe(1);
    expect(s.byStatus[200]).toBe(1);
    expect(s.byStatus[500]).toBe(1);
    expect(s.avgMs).toBeGreaterThanOrEqual(40);
    // per endpoint key normalizes method and strips query
    const keyOk = 'GET /api/x';
    const keyErr = 'GET /api/x';
    expect(s.perEndpoint[keyOk].total).toBe(2);
    expect(s.perEndpoint[keyErr].error).toBe(1);
    expect(s.history.length).toBe(2);
  });

  it('respects pause state', () => {
    setMetricsPaused(true);
    expect(isMetricsPaused()).toBe(true);
    recordMetric({ url: '/api/y', method: 'POST', status: 201, ok: true, durationMs: 10 });
    const s = getMetricsSnapshot();
    expect(s.total).toBe(0);
    setMetricsPaused(false);
    expect(isMetricsPaused()).toBe(false);
  });

  it('export/import JSON roundtrips, and resetEndpoint works', () => {
    recordMetric({ url: '/api/z', method: 'DELETE', status: 204, ok: true, durationMs: 5 });
    let s = getMetricsSnapshot();
    const json = exportMetricsJSON();
    expect(json).toContain('total');
    resetMetrics();
    expect(getMetricsSnapshot().total).toBe(0);
    const ok = importMetricsJSON(json);
    expect(ok).toBe(true);
    s = getMetricsSnapshot();
    expect(s.total).toBe(1);
    const key = 'DELETE /api/z';
    expect(s.perEndpoint[key].total).toBe(1);
    resetEndpoint(key);
    expect(getMetricsSnapshot().perEndpoint[key]).toBeUndefined();
  });

  it('importMetricsJSON handles invalid JSON safely', () => {
    expect(importMetricsJSON('not json')).toBe(false);
    expect(importMetricsJSON(JSON.stringify(null))).toBe(false);
    expect(importMetricsJSON(JSON.stringify({ total: 'x' }))).toBe(true);
    expect(getMetricsSnapshot().total).toBe(0);
  });

  it('exportMetricsJSON handles stringify errors gracefully', () => {
    // Prime some state
    recordMetric({ url: '/api/a', method: 'GET', status: 200, ok: true, durationMs: 1 });
    const originalStringify = JSON.stringify;
    // Force JSON.stringify to throw
    // @ts-expect-error override for test
    JSON.stringify = () => { throw new Error('boom'); };
    try {
      const json = exportMetricsJSON();
      expect(json).toBe('{}');
    } finally {
      JSON.stringify = originalStringify;
    }
  });
});
