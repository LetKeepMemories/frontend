import { isAxiosError } from 'axios';

export interface ApiErrorData {
  detail?: string;
  code?: string;
  errors?: Record<string, string[]>;
  [field: string]: unknown;
}

/** Capitalise a snake_case / lowercase field name into a friendly label. */
function friendlyFieldName(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Return an array of user-friendly error strings extracted from an API error.
 *
 * When the backend returns the shape
 *   `{ detail: "Validation failed.", errors: { password: ["…", "…"] } }`
 * this helper formats each field error into a readable sentence.
 *
 * Falls back to `[fallback]` when nothing useful can be extracted.
 */
export function getValidationErrors(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string[] {
  if (isAxiosError<ApiErrorData>(err) && err.response?.data) {
    const data = err.response.data;

    // If the backend wrapped field errors inside `errors`, extract them.
    if (data.errors && typeof data.errors === 'object') {
      const messages: string[] = [];
      for (const [field, fieldErrors] of Object.entries(data.errors)) {
        if (Array.isArray(fieldErrors)) {
          for (const msg of fieldErrors) {
            if (typeof msg === 'string') {
              messages.push(`${friendlyFieldName(field)}: ${msg}`);
            }
          }
        }
      }
      if (messages.length > 0) return messages;
    }

    // Check if the detail string looks like a raw Python error
    const isRawError = (str: string) => {
      const lower = str.toLowerCase();
      return (
        lower.includes('object has no attribute') ||
        lower.includes('traceback (most recent call') ||
        lower.includes('django.') ||
        lower.includes('exception:') ||
        lower.includes('typeerror:') ||
        lower.includes('valueerror:') ||
        lower.includes('keyerror:')
      );
    };

    // Simple { detail: "..." } shape — use it directly (unless it's the
    // generic "Validation failed." wrapper which is unhelpful on its own).
    if (
      typeof data.detail === 'string' &&
      data.detail.toLowerCase() !== 'validation failed.'
    ) {
      if (isRawError(data.detail)) return [fallback];
      return [data.detail];
    }

    // Last resort: grab any string value from the payload.
    const firstFieldError = Object.values(data)
      .flat()
      .find((value) => typeof value === 'string');
    
    if (firstFieldError) {
      const msg = firstFieldError as string;
      if (isRawError(msg)) return [fallback];
      return [msg];
    }
  }
  return [fallback];
}

/**
 * Convenience wrapper that returns a single string.
 * Joins multiple validation messages with a newline so callers that only
 * support a single string still get all the context.
 */
export function getErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  return getValidationErrors(err, fallback).join('\n');
}

export function getErrorCode(err: unknown): string | undefined {
  if (isAxiosError<ApiErrorData>(err) && err.response?.data) {
    return err.response.data.code;
  }
  return undefined;
}
