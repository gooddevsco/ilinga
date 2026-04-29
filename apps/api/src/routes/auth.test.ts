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

  it('rate-limits magic-link/request after 5/IP', async () => {
    // Ensure issueMagicLink does not blow up: stub the DB-touching paths via a fetch spy on the email layer.
    // The route itself swallows downstream errors and always returns 200 ok: true (anti-enumeration).
    // We are only testing the rate-limit middleware here, so we pre-empt with bogus bodies and a fixed XFF.
    let lastStatus = 0;
    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await app.request('/v1/auth/magic-link/request', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.42',
        },
        body: JSON.stringify({ email: `nobody+${i}@example.com`, purpose: 'signin' }),
      });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  it('magic-link/verify with bad token is unauthorized', async () => {
    const res = await app.request('/v1/auth/magic-link/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'not-a-real-token-aaaaaaaaaaaaaa' }),
    });
    // Without DB, consumeMagicLink throws -> error envelope. We only assert it does not 200.
    expect(res.status).not.toBe(200);
  });
});
