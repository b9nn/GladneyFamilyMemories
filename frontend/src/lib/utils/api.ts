import { isAxiosError } from 'axios';

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string' && detail) return detail;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
