/**
 * Time-zone-aware formatters used throughout the app. Caller passes the
 * user's timezone (string IANA name) — never raw `toLocaleString()`.
 */
export const formatDateTZ = (
  date: Date | string,
  tz: string,
  opts?: Intl.DateTimeFormatOptions,
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    dateStyle: 'medium',
    timeStyle: 'short',
    ...opts,
  }).format(d);
};

export const formatMoney = (cents: number, currency = 'USD'): string =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(cents / 100);

export const formatNumber = (n: number, opts?: Intl.NumberFormatOptions): string =>
  new Intl.NumberFormat('en-GB', { notation: 'standard', ...opts }).format(n);
