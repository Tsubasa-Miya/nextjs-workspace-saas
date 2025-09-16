export type FieldErrorsMap = Record<string, string[]>;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

// Try to extract Zod-like flattened fieldErrors from arbitrary server error payloads.
export function extractFieldErrors(input: unknown): FieldErrorsMap | null {
  if (!isRecord(input)) return null;
  const baseCandidate = (isRecord(input.error) ? input.error : null)
    ?? (isRecord(input.message) ? input.message : null)
    ?? input;
  if (!isRecord(baseCandidate)) return null;
  const fieldErrorsCandidate = baseCandidate.fieldErrors;
  if (!isRecord(fieldErrorsCandidate)) return null;
  const out: FieldErrorsMap = {};
  for (const [key, value] of Object.entries(fieldErrorsCandidate)) {
    if (Array.isArray(value)) {
      const arr = value.filter((entry): entry is string => typeof entry === 'string');
      if (arr.length) out[key] = arr;
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
  const record = isRecord(data) ? data : null;
  const err = record?.error ?? record?.message ?? null;
  if (typeof err === 'string') return err;
  if (isRecord(err)) {
    const formErrors = Array.isArray(err.formErrors) ? err.formErrors.filter((v): v is string => typeof v === 'string') : [];
    const fe = extractFieldErrors(err);
    const fieldErrs = fe ? Object.values(fe).flat() : [];
    const combined = [...formErrors, ...fieldErrs].filter((v): v is string => typeof v === 'string');
    if (combined.length) return combined.join(', ');
  }
  return fallback;
}
