import { extractFieldErrors, shapeMessage, type FieldErrorsMap } from './fieldErrors';
import { recordMetric } from './apiMetrics';

export type ApiSuccess<T> = { ok: true; data: T; status: number };
export type ApiError = { ok: false; data?: unknown; status: number; error: { message: string; fieldErrors?: FieldErrorsMap } };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

function withJsonHeaders(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers || {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return { ...init, headers };
}

let unauthorizedHandler: ((status: number) => void) | null = null;
type RequestLog = {
  url: string | URL;
  method?: string;
  status: number;
  ok: boolean;
  durationMs: number;
};
let requestLogger: ((log: RequestLog) => void) | null = null;

export function setUnauthorizedHandler(handler: ((status: number) => void) | null) {
  unauthorizedHandler = handler;
}

export function setRequestLogger(handler: ((log: RequestLog) => void) | null) {
  requestLogger = handler;
}

const DEFAULT_TIMEOUT_MS = 15000;

export async function apiFetch<T = unknown>(input: RequestInfo, init?: RequestInit & { timeoutMs?: number; retries?: number; retryOn?: number[]; retryDelayMs?: number }): Promise<ApiResult<T>> {
  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = init?.retries ?? 0;
  const retryOn = init?.retryOn ?? [429, 502, 503, 504];
  const retryDelayMs = init?.retryDelayMs ?? 600;
  let signal = init?.signal;
  let controller: AbortController | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  if (!signal) {
    controller = new AbortController();
    signal = controller.signal;
    timeoutId = setTimeout(() => controller?.abort(), timeoutMs);
  }
  try {
    let attempt = 0;
    const start = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const res = await fetch(input, { ...init, signal });
        let data: unknown;
        try {
          data = await res.json();
        } catch (_) {
          data = undefined;
        }
        if (res.ok) {
          const durationMs = Date.now() - start;
          const urlVal = typeof input === 'string' ? input : (input as URL);
          requestLogger?.({ url: urlVal, method: (init?.method || 'GET'), status: res.status, ok: true, durationMs });
          recordMetric({ url: urlVal, method: (init?.method || 'GET'), status: res.status, ok: true, durationMs });
          return { ok: true, data: data as T, status: res.status };
        }
        if (res.status === 401 && unauthorizedHandler) unauthorizedHandler(res.status);
        // Retry on configured status codes
        if (attempt < retries && retryOn.includes(res.status)) {
          attempt++;
          await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
          continue;
        }
        const fieldErrors = extractFieldErrors(data) || undefined;
        const message = shapeMessage(data, 'Operation failed');
        const durationMs = Date.now() - start;
        const urlVal = typeof input === 'string' ? input : (input as URL);
        requestLogger?.({ url: urlVal, method: (init?.method || 'GET'), status: res.status, ok: false, durationMs });
        recordMetric({ url: urlVal, method: (init?.method || 'GET'), status: res.status, ok: false, durationMs });
        return { ok: false, data, status: res.status, error: { message, fieldErrors } };
      } catch (err: any) {
        const isAbort = err?.name === 'AbortError';
        if (attempt < retries && !isAbort) {
          attempt++;
          await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
          continue;
        }
        const message = isAbort ? 'Request timed out' : 'Network error';
        const durationMs = Date.now() - start;
        const urlVal = typeof input === 'string' ? input : (input as URL);
        requestLogger?.({ url: urlVal, method: (init?.method || 'GET'), status: 0, ok: false, durationMs });
        recordMetric({ url: urlVal, method: (init?.method || 'GET'), status: 0, ok: false, durationMs });
        return { ok: false, status: 0, error: { message } } as ApiError;
      }
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function postJson<T = unknown>(
  url: string,
  body: unknown,
  init?: RequestInit & { timeoutMs?: number; retries?: number; retryOn?: number[]; retryDelayMs?: number }
): Promise<ApiResult<T>> {
  const { timeoutMs, retries, retryOn, retryDelayMs, ...rest } = init || {} as any;
  const req = withJsonHeaders({ ...rest, method: 'POST', body: JSON.stringify(body), signal: rest?.signal }) as RequestInit & {
    timeoutMs?: number; retries?: number; retryOn?: number[]; retryDelayMs?: number
  };
  (req as any).timeoutMs = timeoutMs;
  (req as any).retries = retries;
  (req as any).retryOn = retryOn;
  (req as any).retryDelayMs = retryDelayMs;
  return apiFetch<T>(url, req);
}

export async function patchJson<T = unknown>(
  url: string,
  body: unknown,
  init?: RequestInit & { timeoutMs?: number; retries?: number; retryOn?: number[]; retryDelayMs?: number }
): Promise<ApiResult<T>> {
  const { timeoutMs, retries, retryOn, retryDelayMs, ...rest } = init || {} as any;
  const req = withJsonHeaders({ ...rest, method: 'PATCH', body: JSON.stringify(body), signal: rest?.signal }) as RequestInit & {
    timeoutMs?: number; retries?: number; retryOn?: number[]; retryDelayMs?: number
  };
  (req as any).timeoutMs = timeoutMs;
  (req as any).retries = retries;
  (req as any).retryOn = retryOn;
  (req as any).retryDelayMs = retryDelayMs;
  return apiFetch<T>(url, req);
}
