import { describe, it, expect } from 'vitest';
import { signWebhookBody, verifyWebhookBody } from './sign.js';

describe('outbound webhook signing', () => {
  it('round-trips a sign + verify', () => {
    const sig = signWebhookBody('whsec', '{"x":1}');
    expect(verifyWebhookBody('whsec', '{"x":1}', sig)).toBe(true);
  });
  it('rejects a tampered body', () => {
    const sig = signWebhookBody('whsec', '{"x":1}');
    expect(verifyWebhookBody('whsec', '{"x":2}', sig)).toBe(false);
  });
  it('rejects a different secret', () => {
    const sig = signWebhookBody('whsec', '{"x":1}');
    expect(verifyWebhookBody('whsec_other', '{"x":1}', sig)).toBe(false);
  });
});
