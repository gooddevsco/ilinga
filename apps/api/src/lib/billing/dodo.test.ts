import { createHmac } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { verifyDodoSignature } from './dodo.js';

describe('Dodo signature verifier', () => {
  const secret = 'whsec_test';
  const body = JSON.stringify({ event: 'checkout.completed', id: 'evt_1' });
  const correct = createHmac('sha256', secret).update(body).digest('hex');

  it('verifies a correct signature', () => {
    expect(verifyDodoSignature(body, correct, secret)).toBe(true);
  });
  it('rejects a tampered body', () => {
    const tampered = body.replace('checkout.completed', 'checkout.tampered');
    expect(verifyDodoSignature(tampered, correct, secret)).toBe(false);
  });
  it('rejects a missing header', () => {
    expect(verifyDodoSignature(body, undefined, secret)).toBe(false);
  });
  it('rejects a wrong secret', () => {
    expect(verifyDodoSignature(body, correct, 'whsec_other')).toBe(false);
  });
});
