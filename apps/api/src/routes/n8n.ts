import { Hono } from 'hono';
import { ulid } from 'ulid';
import { config } from '../config.js';
import { verify } from '../lib/n8n/hmac.js';
import { sseHub } from '../lib/sse/hub.js';
import { unauthorized } from '../lib/problem.js';

const seenInbound = new Set<string>();
const seenCallback = new Set<string>();

export const n8nRoutes = new Hono();

n8nRoutes.post('/exec', async (c) => {
  const cfg = config();
  const raw = await c.req.text();
  const r = verify({
    secret: cfg.NODE_ENV === 'test' ? 'test-inbound' : process.env.N8N_INBOUND_SECRET ?? '',
    ts: c.req.header('x-il-timestamp'),
    nonce: c.req.header('x-il-nonce'),
    signature: c.req.header('x-il-signature'),
    rawBody: raw,
    seenNonces: seenInbound,
  });
  if (!r.ok) throw unauthorized(`n8n inbound rejected: ${r.reason}`);
  // Phase 10 stub: accept the payload and return a synthetic execution id.
  return c.json({ ok: true, executionId: ulid() });
});

n8nRoutes.post('/callbacks/progress', async (c) => {
  const cfg = config();
  const raw = await c.req.text();
  const r = verify({
    secret: cfg.NODE_ENV === 'test' ? 'test-cb' : process.env.N8N_CALLBACK_SECRET ?? '',
    ts: c.req.header('x-il-timestamp'),
    nonce: c.req.header('x-il-nonce'),
    signature: c.req.header('x-il-signature'),
    rawBody: raw,
    seenNonces: seenCallback,
  });
  if (!r.ok) throw unauthorized(`n8n callback rejected: ${r.reason}`);
  const body = JSON.parse(raw) as { cycleId?: string; data?: unknown; event?: string };
  if (body.cycleId && body.event) {
    await sseHub.publish(`cycle:${body.cycleId}`, {
      id: ulid(),
      event: body.event,
      data: body.data ?? {},
    });
  }
  return c.json({ ok: true });
});
