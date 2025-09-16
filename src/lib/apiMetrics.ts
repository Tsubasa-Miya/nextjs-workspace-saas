export type ApiMetricLog = {
  url: string | URL;
  method?: string;
  status: number;
  ok: boolean;
  durationMs: number;
};

type MetricsState = {
  total: number;
  success: number;
  error: number;
  totalDurationMs: number;
  byStatus: Record<number, number>;
  history: ApiMetricLog[];
  perEndpoint: Record<string, { total: number; success: number; error: number; totalDurationMs: number; lastMs: number; samples: number[] }>;
  since: number;
};

let state: MetricsState = {
  total: 0,
  success: 0,
  error: 0,
  totalDurationMs: 0,
  byStatus: {},
  history: [],
  perEndpoint: {},
  since: Date.now(),
};

type Listener = (s: Readonly<MetricsState>) => void;
const listeners = new Set<Listener>();
let paused = false;

export function recordMetric(log: ApiMetricLog) {
  if (paused) return;
  state.total += 1;
  if (log.ok) state.success += 1; else state.error += 1;
  state.totalDurationMs += Math.max(0, log.durationMs || 0);
  const code = log.status || 0;
  state.byStatus[code] = (state.byStatus[code] || 0) + 1;
  // Normalize url (strip query/hash)
  const raw = log.url as any;
  let key = typeof raw === 'string' ? raw.split('?')[0] : (raw && typeof raw === 'object' && 'pathname' in raw ? (raw as URL).pathname : String(raw));
  const method = (log.method || 'GET').toUpperCase();
  const ep = `${method} ${key}`;
  const epStat = state.perEndpoint[ep] || { total: 0, success: 0, error: 0, totalDurationMs: 0, lastMs: 0, samples: [] };
  epStat.total += 1;
  if (log.ok) epStat.success += 1; else epStat.error += 1;
  epStat.totalDurationMs += Math.max(0, log.durationMs || 0);
  epStat.lastMs = Math.max(0, log.durationMs || 0);
  epStat.samples.push(epStat.lastMs);
  if (epStat.samples.length > 100) epStat.samples.shift();
  state.perEndpoint[ep] = epStat;
  // Keep bounded history (last 50)
  state.history.push(log);
  if (state.history.length > 50) state.history.shift();
  for (const l of listeners) l(state);
}

export function getMetricsSnapshot() {
  const avgMs = state.total ? Math.round(state.totalDurationMs / state.total) : 0;
  return { ...state, avgMs };
}

export function onMetrics(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetMetrics() {
  state = {
    total: 0,
    success: 0,
    error: 0,
    totalDurationMs: 0,
    byStatus: {},
    history: [],
    perEndpoint: {},
    since: Date.now(),
  };
  for (const l of listeners) l(state);
}

export function exportMetricsJSON() {
  try {
    return JSON.stringify(state);
  } catch (_) {
    return '{}';
  }
}

export function importMetricsJSON(json: string) {
  try {
    const parsed = JSON.parse(json) as Partial<MetricsState> | null;
    if (!parsed || typeof parsed !== 'object') return false;
    state = {
      total: Number((parsed as any).total) || 0,
      success: Number((parsed as any).success) || 0,
      error: Number((parsed as any).error) || 0,
      totalDurationMs: Number((parsed as any).totalDurationMs) || 0,
      byStatus: ((parsed as any).byStatus && typeof (parsed as any).byStatus === 'object') ? (parsed as any).byStatus as Record<number, number> : {},
      history: Array.isArray((parsed as any).history) ? (parsed as any).history as ApiMetricLog[] : [],
      perEndpoint: ((parsed as any).perEndpoint && typeof (parsed as any).perEndpoint === 'object') ? (parsed as any).perEndpoint as MetricsState['perEndpoint'] : {},
      since: Number((parsed as any).since) || Date.now(),
    };
    for (const l of listeners) l(state);
    return true;
  } catch {
    return false;
  }
}

export function setMetricsPaused(v: boolean) {
  paused = v;
}

export function isMetricsPaused() {
  return paused;
}

export function resetEndpoint(key: string) {
  if (!key) return;
  if (state.perEndpoint[key]) {
    delete state.perEndpoint[key];
    for (const l of listeners) l(state);
  }
}
