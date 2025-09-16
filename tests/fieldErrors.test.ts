import { describe, it, expect } from 'vitest';
import { extractFieldErrors, firstFieldError, shapeMessage, type FieldErrorsMap } from '@/src/lib/fieldErrors';

describe('fieldErrors utilities', () => {
  it('extractFieldErrors returns null on invalid inputs', () => {
    expect(extractFieldErrors(null)).toBeNull();
    expect(extractFieldErrors(undefined)).toBeNull();
    expect(extractFieldErrors('str' as any)).toBeNull();
    expect(extractFieldErrors(123 as any)).toBeNull();
    expect(extractFieldErrors({})).toBeNull();
    expect(extractFieldErrors({ error: 'oops' })).toBeNull();
    expect(extractFieldErrors({ error: { fieldErrors: 'bad' } as any })).toBeNull();
  });

  it('extractFieldErrors extracts only string arrays', () => {
    const input = {
      error: {
        fieldErrors: {
          email: ['Required', 123, null],
          name: ['Too long'],
          age: [99],
        },
      },
    };
    const res = extractFieldErrors(input);
    expect(res).toEqual({ email: ['Required'], name: ['Too long'] });
  });

  it('firstFieldError returns first error string or null', () => {
    const map: FieldErrorsMap = { a: ['x', 'y'] };
    expect(firstFieldError(map, 'a')).toBe('x');
    expect(firstFieldError(map, 'missing')).toBeNull();
    expect(firstFieldError({ a: [] }, 'a')).toBeNull();
  });

  it('shapeMessage prefers string message', () => {
    expect(shapeMessage({ message: 'Nope' })).toBe('Nope');
    expect(shapeMessage({ error: 'Bad' })).toBe('Bad');
  });

  it('shapeMessage combines form and field errors', () => {
    const input = {
      error: {
        formErrors: ['Form bad', 1],
        fieldErrors: {
          email: ['Email bad'],
          name: ['Name bad'],
        },
      },
    };
    expect(shapeMessage(input)).toBe('Form bad, Email bad, Name bad');
  });

  it('shapeMessage falls back when nothing useful', () => {
    expect(shapeMessage({})).toBe('Operation failed');
    expect(shapeMessage({ error: {} })).toBe('Operation failed');
    expect(shapeMessage({ error: { formErrors: [] } })).toBe('Operation failed');
    expect(shapeMessage({ error: { fieldErrors: {} } })).toBe('Operation failed');
    expect(shapeMessage({ whatever: true } as any, 'Fallback')).toBe('Fallback');
  });
});

