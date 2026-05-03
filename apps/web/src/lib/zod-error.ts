import type { ApiError } from './api';

/**
 * Pull a per-field error message out of a problem+json response. Falls back
 * to the API's overall detail/title.
 */
export const fieldError = (err: unknown, field: string): string | undefined => {
  if (!err || typeof err !== 'object') return undefined;
  const e = err as Partial<ApiError>;
  return e.fieldErrors?.[field];
};

export const overallError = (err: unknown): string => {
  if (!err || typeof err !== 'object') return 'Something went wrong.';
  const e = err as Partial<ApiError>;
  return e.detail ?? e.message ?? `Status ${e.status ?? 'unknown'}`;
};
