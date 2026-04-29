import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildSender, inMemorySender, type SendInput } from './sender.js';

const baseInput: SendInput = {
  to: 'a@b.com',
  from: 'noreply@ilinga.com',
  subject: 'hello',
  html: '<p>hi</p>',
  text: 'hi',
};

describe('inMemorySender', () => {
  it('captures sends to a sink', async () => {
    const sink: SendInput[] = [];
    const s = inMemorySender(sink);
    const r = await s.send(baseInput);
    expect(sink).toHaveLength(1);
    expect(r.provider).toBe('in-memory');
  });
});

describe('failover sender', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses primary when it succeeds', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'rsd_1' }), { status: 200 }),
    );
    const sender = buildSender({
      primary: 'resend',
      failover: 'postmark',
      resendApiKey: 'rsd',
      postmarkApiKey: 'pm',
    });
    const r = await sender.send(baseInput);
    expect(r.provider).toBe('resend');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('falls over to postmark when resend fails', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('boom', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ MessageID: 'pm_1' }), { status: 200 }),
      );
    const sender = buildSender({
      primary: 'resend',
      failover: 'postmark',
      resendApiKey: 'rsd',
      postmarkApiKey: 'pm',
    });
    const r = await sender.send(baseInput);
    expect(r.provider).toBe('postmark');
    expect(r.providerMessageId).toBe('pm_1');
  });

  it('throws when both providers fail', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('boom1', { status: 500 }))
      .mockResolvedValueOnce(new Response('boom2', { status: 500 }));
    const sender = buildSender({
      primary: 'resend',
      failover: 'postmark',
      resendApiKey: 'rsd',
      postmarkApiKey: 'pm',
    });
    await expect(sender.send(baseInput)).rejects.toThrow();
  });
});
