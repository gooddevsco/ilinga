import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * HMAC + replay protection per docs/IMPLEMENTATION_PLAN.md §7.
 * Header order: X-Il-Timestamp, X-Il-Nonce, X-Il-Signature.
 * Signature payload: `${ts}\n${nonce}\n${rawBody}` signed with the shared
 * secret (one secret for inbound, another for callbacks).
 */

const MAX_SKEW_SECONDS = 300;

export const sign = (secret: string, ts: string, nonce: string, rawBody: string): string =>
  createHmac('sha256', secret).update(`${ts}\n${nonce}\n${rawBody}`).digest('hex');

export interface VerifyInput {
  secret: string;
  ts: string | undefined;
  nonce: string | undefined;
  signature: string | undefined;
  rawBody: string;
  /** Optional nonce store; if omitted, replay is detected only via timestamp. */
  seenNonces?: Set<string>;
  now?: () => number;
}

export const verify = (input: VerifyInput): { ok: boolean; reason?: string } => {
  if (!input.ts || !input.nonce || !input.signature) return { ok: false, reason: 'missing headers' };
  const tsNum = Number.parseInt(input.ts, 10);
  if (!Number.isFinite(tsNum)) return { ok: false, reason: 'bad timestamp' };
  const nowMs = (input.now ?? (() => Date.now()))();
  if (Math.abs(nowMs / 1000 - tsNum) > MAX_SKEW_SECONDS) return { ok: false, reason: 'skew' };
  const expected = sign(input.secret, input.ts, input.nonce, input.rawBody);
  const a = Buffer.from(expected);
  const b = Buffer.from(input.signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: 'sig' };
  if (input.seenNonces) {
    if (input.seenNonces.has(input.nonce)) return { ok: false, reason: 'replay' };
    input.seenNonces.add(input.nonce);
  }
  return { ok: true };
};
