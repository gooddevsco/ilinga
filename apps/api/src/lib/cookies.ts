import type { Context } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { config } from '../config.js';

export const SESSION_COOKIE = 'il_session';
export const CSRF_COOKIE = 'il_csrf';
export const DEVICE_COOKIE = 'il_device';

const baseOpts = () => {
  const cfg = config();
  return {
    domain: cfg.IL_COOKIE_DOMAIN,
    path: '/',
    secure: cfg.NODE_ENV !== 'development',
    httpOnly: true as const,
    sameSite: 'Lax' as const,
  };
};

export const writeSessionCookie = (c: Context, value: string, expiresAt: Date): void => {
  setCookie(c, SESSION_COOKIE, value, { ...baseOpts(), expires: expiresAt });
};

export const writeCsrfCookie = (c: Context, value: string): void => {
  setCookie(c, CSRF_COOKIE, value, { ...baseOpts(), httpOnly: false, sameSite: 'Strict' });
};

export const writeDeviceCookie = (c: Context, value: string): void => {
  const cfg = config();
  const expires = new Date(Date.now() + cfg.IL_DEVICE_TRUST_DAYS * 86_400_000);
  setCookie(c, DEVICE_COOKIE, value, { ...baseOpts(), expires });
};

export const readSession = (c: Context): string | undefined => getCookie(c, SESSION_COOKIE);
export const readCsrf = (c: Context): string | undefined => getCookie(c, CSRF_COOKIE);
export const readDevice = (c: Context): string | undefined => getCookie(c, DEVICE_COOKIE);

export const clearAuthCookies = (c: Context): void => {
  deleteCookie(c, SESSION_COOKIE, baseOpts());
  deleteCookie(c, CSRF_COOKIE, { ...baseOpts(), httpOnly: false, sameSite: 'Strict' });
};
