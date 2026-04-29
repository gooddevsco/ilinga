import { createHmac, timingSafeEqual } from 'node:crypto';

export const verifyDodoSignature = (
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string,
): boolean => {
  if (!signatureHeader) return false;
  const computed = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(computed);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

export interface DodoCheckoutInput {
  productId: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}

export interface DodoCheckoutResult {
  url: string;
  sessionId: string;
}

export const createDodoCheckout = async (
  input: DodoCheckoutInput,
): Promise<DodoCheckoutResult> => {
  const apiKey = process.env.DODO_API_KEY ?? '';
  const baseUrl = process.env.DODO_BASE_URL ?? 'https://api.dodopayments.com';
  if (!apiKey) {
    return { url: `${input.successUrl}#mock`, sessionId: `mock_${Date.now().toString(36)}` };
  }
  const res = await fetch(`${baseUrl}/v1/checkout/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      product_id: input.productId,
      metadata: input.metadata,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    }),
  });
  if (!res.ok) throw new Error(`dodo checkout ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { url: string; id: string };
  return { url: body.url, sessionId: body.id };
};
