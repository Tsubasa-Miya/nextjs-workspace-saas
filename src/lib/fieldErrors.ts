export type FieldErrorsMap = Record<string, string[]>;

// Try to extract Zod-like flattened fieldErrors from arbitrary server error payloads.
export function extractFieldErrors(input: unknown): FieldErrorsMap | null {
  if (!input || typeof input !== 'object') return null;
  const base = (input as any).error ?? (input as any).message ?? input;
  if (!base || typeof base !== 'object') return null;
  const fe = (base as any).fieldErrors;
  if (!fe || typeof fe !== 'object') return null;
  const out: FieldErrorsMap = {};
  for (const [k, v] of Object.entries(fe as Record<string, unknown>)) {
    if (Array.isArray(v)) {
      const arr = (v as unknown[]).filter((x): x is string => typeof x === 'string');
      if (arr.length) out[k] = arr;
    }
  }
  return Object.keys(out).length ? out : null;
}

export function firstFieldError(map: FieldErrorsMap | null | undefined, key: string): string | null {
  if (!map) return null;
  const arr = map[key];
  if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'string') return arr[0];
  return null;
}

export function shapeMessage(data: unknown, fallback = 'Operation failed'): string {
  const base = data as { error?: unknown; message?: unknown } | null;
  const err = base && (base.error ?? base.message);
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const formErrors = Array.isArray((err as any).formErrors) ? ((err as any).formErrors as unknown[]) : [];
    const fe = extractFieldErrors(err);
    const fieldErrs = fe ? Object.values(fe).flat() : [];
    const combined = [...formErrors, ...fieldErrs].filter((v): v is string => typeof v === 'string');
    if (combined.length) return combined.join(', ');
  }
  return fallback;
}

