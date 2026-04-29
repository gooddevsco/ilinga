import { afterEach, beforeAll, describe, it, expect, vi } from 'vitest';
import { app } from '../index.js';
import { __resetMemBuckets } from '../lib/rate-limit.js';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  __resetMemBuckets();
  vi.restoreAllMocks();
});

describe('auth surface', () => {
  it('csrf endpoint returns null when no cookie present', async () => {
    const res = await app.request('/v1/auth/csrf');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ csrf: null });
  });

  it('magic-link/verify with bad token does not return 200', async () => {
    // Without a real DB consumeMagicLink throws into the error envelope; we
    // only assert the success path is NOT taken.
    const res = await app.request('/v1/auth/magic-link/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'not-a-real-token-aaaaaaaaaaaaaa' }),
    });
    expect(res.status).not.toBe(200);
  });
});
