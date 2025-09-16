import { extractFieldErrors, shapeMessage, type FieldErrorsMap } from './fieldErrors';
import { recordMetric } from './apiMetrics';

export type ApiSuccess<T> = { ok: true; data: T; status: number };
export type ApiError = { ok: false; data?: unknown; status: number; error: { message: string; fieldErrors?: FieldErrorsMap } };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

type ApiRequestInit = RequestInit & {
  timeoutMs?: number;
  retries?: number;
  retryOn?: number[];
  retryDelayMs?: number;
};

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

export async function apiFetch<T = unknown>(input: RequestInfo, init?: ApiRequestInit): Promise<ApiResult<T>> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 0,
    retryOn = [429, 502, 503, 504],
    retryDelayMs = 600,
    ...rest
  } = init ?? {};
  const { signal: initialSignal, ...fetchInit } = rest;
  let signal = initialSignal;
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
    const httpMethod = typeof fetchInit.method === 'string' ? fetchInit.method.toUpperCase() : 'GET';
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const res = await fetch(input, { ...fetchInit, signal });
        let data: unknown;
        try {
          data = await res.json();
        } catch {
          data = undefined;
        }
        const urlVal: string | URL = typeof input === 'string'
          ? input
          : input instanceof URL
            ? input
            : typeof (input as { url?: unknown }).url === 'string'
              ? (input as { url: string }).url
              : String(input);
        const durationMs = Date.now() - start;
        if (res.ok) {
          requestLogger?.({ url: urlVal, method: httpMethod, status: res.status, ok: true, durationMs });
          recordMetric({ url: urlVal, method: httpMethod, status: res.status, ok: true, durationMs });
          return { ok: true, data: data as T, status: res.status };
        }
        if (res.status === 401 && unauthorizedHandler) unauthorizedHandler(res.status);
        if (attempt < retries && retryOn.includes(res.status)) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
          continue;
        }
        const fieldErrors = extractFieldErrors(data) || undefined;
        const message = shapeMessage(data, 'Operation failed');
        requestLogger?.({ url: urlVal, method: httpMethod, status: res.status, ok: false, durationMs });
        recordMetric({ url: urlVal, method: httpMethod, status: res.status, ok: false, durationMs });
        return { ok: false, data, status: res.status, error: { message, fieldErrors } };
      } catch (err: unknown) {
        const isAbort = typeof err === 'object' && err !== null && 'name' in err && (err as { name?: string }).name === 'AbortError';
        if (attempt < retries && !isAbort) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
          continue;
        }
        const message = isAbort ? 'Request timed out' : 'Network error';
        const durationMs = Date.now() - start;
        const urlVal: string | URL = typeof input === 'string'
          ? input
          : input instanceof URL
            ? input
            : typeof (input as { url?: unknown }).url === 'string'
              ? (input as { url: string }).url
              : String(input);
        requestLogger?.({ url: urlVal, method: httpMethod, status: 0, ok: false, durationMs });
        recordMetric({ url: urlVal, method: httpMethod, status: 0, ok: false, durationMs });
        return { ok: false, status: 0, error: { message } };
      }
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function postJson<T = unknown>(
  url: string,
  body: unknown,
  init?: ApiRequestInit
): Promise<ApiResult<T>> {
  const {
    timeoutMs,
    retries,
    retryOn,
    retryDelayMs,
    ...rest
  } = init ?? {};
  const base = withJsonHeaders({ ...rest, method: 'POST', body: JSON.stringify(body) });
  const req: ApiRequestInit = {
    ...base,
    timeoutMs,
    retries,
    retryOn,
    retryDelayMs,
  };
  return apiFetch<T>(url, req);
}

export async function patchJson<T = unknown>(
  url: string,
  body: unknown,
  init?: ApiRequestInit
): Promise<ApiResult<T>> {
  const {
    timeoutMs,
    retries,
    retryOn,
    retryDelayMs,
    ...rest
  } = init ?? {};
  const base = withJsonHeaders({ ...rest, method: 'PATCH', body: JSON.stringify(body) });
  const req: ApiRequestInit = {
    ...base,
    timeoutMs,
    retries,
    retryOn,
    retryDelayMs,
  };
  return apiFetch<T>(url, req);
}
