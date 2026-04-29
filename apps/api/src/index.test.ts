import { describe, it, expect, beforeAll } from 'vitest';
import { app } from './index.js';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

describe('healthz', () => {
  it('returns ok=true', async () => {
    const res = await app.request('/v1/internal/healthz');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, service: 'ilinga-api' });
  });

  it('emits a request id header', async () => {
    const res = await app.request('/v1/internal/healthz');
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });

  it('echoes a caller-supplied request id', async () => {
    const res = await app.request('/v1/internal/healthz', {
      headers: { 'x-request-id': 'req_unit_test_42' },
    });
    expect(res.headers.get('x-request-id')).toBe('req_unit_test_42');
  });

  it('refuses a malformed caller-supplied request id', async () => {
    const res = await app.request('/v1/internal/healthz', {
      headers: { 'x-request-id': 'a b c' },
    });
    const id = res.headers.get('x-request-id');
    expect(id).not.toBe('a b c');
    expect(id).toBeTruthy();
  });

  it('404s unknown paths with problem+json', async () => {
    const res = await app.request('/v1/no-such-thing');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toMatch(/application\/problem\+json/);
  });

  it('reaches /v1/auth/csrf with no session', async () => {
    const res = await app.request('/v1/auth/csrf');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ csrf: null });
  });
});
