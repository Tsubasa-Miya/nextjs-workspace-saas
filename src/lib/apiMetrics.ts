type MetricUrl = string | URL | { url: string };

export type ApiMetricLog = {
  url: MetricUrl;
  method?: string;
  status: number;
  ok: boolean;
  durationMs: number;
};

type EndpointMetrics = {
  total: number;
  success: number;
  error: number;
  totalDurationMs: number;
  lastMs: number;
  samples: number[];
};

type MetricsState = {
  total: number;
  success: number;
  error: number;
  totalDurationMs: number;
  byStatus: Record<number, number>;
  history: ApiMetricLog[];
  perEndpoint: Record<string, EndpointMetrics>;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMetricLog(value: unknown): value is ApiMetricLog {
  if (!isRecord(value)) return false;
  const { url, status, ok, durationMs } = value;
  return (
    (typeof url === 'string' || url instanceof URL || (isRecord(url) && typeof url.url === 'string'))
    && typeof status === 'number'
    && typeof ok === 'boolean'
    && typeof durationMs === 'number'
  );
}

function isEndpointMetrics(value: unknown): value is EndpointMetrics {
  if (!isRecord(value)) return false;
  const { total, success, error, totalDurationMs, lastMs, samples } = value;
  return (
    typeof total === 'number'
    && typeof success === 'number'
    && typeof error === 'number'
    && typeof totalDurationMs === 'number'
    && typeof lastMs === 'number'
    && Array.isArray(samples)
    && samples.every((v) => typeof v === 'number')
  );
}

export function recordMetric(log: ApiMetricLog) {
  if (paused) return;
  state.total += 1;
  if (log.ok) state.success += 1; else state.error += 1;
  state.totalDurationMs += Math.max(0, log.durationMs || 0);
  const code = log.status || 0;
  state.byStatus[code] = (state.byStatus[code] || 0) + 1;
  // Normalize url (strip query/hash)
  const raw = log.url;
  let key: string;
  if (typeof raw === 'string') {
    key = raw.split('?')[0];
  } else if (raw instanceof URL) {
    key = raw.pathname;
  } else if (isRecord(raw) && typeof raw.url === 'string') {
    key = raw.url.split('?')[0];
  } else {
    key = String(raw);
  }
  const method = typeof log.method === 'string' ? log.method.toUpperCase() : 'GET';
  const ep = `${method} ${key}`;
  const existing = state.perEndpoint[ep];
  const epStat: EndpointMetrics = existing ? { ...existing } : { total: 0, success: 0, error: 0, totalDurationMs: 0, lastMs: 0, samples: [] };
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

export function onMetrics(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
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
    if (!isRecord(parsed)) return false;
    const toNumber = (value: unknown, fallback = 0) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
    const byStatusInput = parsed.byStatus;
    const byStatus: Record<number, number> = {};
    if (isRecord(byStatusInput)) {
      for (const [statusKey, value] of Object.entries(byStatusInput)) {
        const numericKey = Number(statusKey);
        byStatus[numericKey] = toNumber(value);
      }
    }
    const historyInput = parsed.history;
    const history = Array.isArray(historyInput) ? historyInput.filter(isMetricLog) : [];
    const perEndpointInput = parsed.perEndpoint;
    const perEndpoint: MetricsState['perEndpoint'] = {};
    if (isRecord(perEndpointInput)) {
      for (const [endpoint, value] of Object.entries(perEndpointInput)) {
        if (isEndpointMetrics(value)) {
          perEndpoint[endpoint] = value;
        }
      }
    }
    state = {
      total: toNumber(parsed.total),
      success: toNumber(parsed.success),
      error: toNumber(parsed.error),
      totalDurationMs: toNumber(parsed.totalDurationMs),
      byStatus,
      history,
      perEndpoint,
      since: toNumber(parsed.since, Date.now()),
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
