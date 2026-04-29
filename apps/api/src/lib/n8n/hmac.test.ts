import { describe, it, expect } from 'vitest';
import { sign, verify } from './hmac.js';

const NOW = 1_700_000_000_000;
const stableNow = (): number => NOW;

describe('n8n HMAC verifier', () => {
  const secret = 'shhh';
  const body = '{"x":1}';
  const ts = String(Math.floor(NOW / 1000));
  const nonce = 'n_1';
  const sig = sign(secret, ts, nonce, body);

  it('verifies a legitimate request', () => {
    const r = verify({ secret, ts, nonce, signature: sig, rawBody: body, now: stableNow });
    expect(r).toEqual({ ok: true });
  });

  it('rejects a tampered body', () => {
    const r = verify({ secret, ts, nonce, signature: sig, rawBody: '{"x":2}', now: stableNow });
    expect(r.ok).toBe(false);
  });

  it('rejects skew > 5 minutes', () => {
    const oldTs = String(Math.floor(NOW / 1000) - 600);
    const oldSig = sign(secret, oldTs, nonce, body);
    const r = verify({ secret, ts: oldTs, nonce, signature: oldSig, rawBody: body, now: stableNow });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('skew');
  });

  it('rejects nonce replay when a store is supplied', () => {
    const seen = new Set<string>();
    expect(verify({ secret, ts, nonce, signature: sig, rawBody: body, seenNonces: seen, now: stableNow }).ok).toBe(true);
    expect(verify({ secret, ts, nonce, signature: sig, rawBody: body, seenNonces: seen, now: stableNow }).ok).toBe(false);
  });
});
