import { describe, it, expect } from 'vitest';
import { app } from './index.js';

describe('healthz', () => {
  it('returns ok=true', async () => {
    const res = await app.request('/v1/internal/healthz');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, service: 'ilinga-api' });
  });
});
