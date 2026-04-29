import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Outbound webhook signing — HMAC-SHA256.
 *
 * Two headers may be sent during a 24h secret-rotation window:
 *   X-Webhook-Signature      = sign(currentSecret, payload)
 *   X-Webhook-Signature-Old  = sign(previousSecret, payload)  (only during grace)
 *
 * Receivers can accept either; once we cut the grace window we stop
 * sending the old header.
 */

export const signWebhookBody = (secret: string, body: string): string =>
  createHmac('sha256', secret).update(body).digest('hex');

export const verifyWebhookBody = (
  secret: string,
  body: string,
  signature: string,
): boolean => {
  const expected = signWebhookBody(secret, body);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
};
