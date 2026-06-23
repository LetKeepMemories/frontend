import { isAxiosError } from 'axios';

export interface ApiErrorData {
  detail?: string;
  code?: string;
  [field: string]: unknown;
}

export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isAxiosError<ApiErrorData>(err) && err.response?.data) {
    const data = err.response.data;
    if (typeof data.detail === 'string') return data.detail;
    const firstFieldError = Object.values(data)
      .flat()
      .find((value) => typeof value === 'string');
    if (firstFieldError) return firstFieldError as string;
  }
  return fallback;
}

export function getErrorCode(err: unknown): string | undefined {
  if (isAxiosError<ApiErrorData>(err) && err.response?.data) {
    return err.response.data.code;
  }
  return undefined;
}
