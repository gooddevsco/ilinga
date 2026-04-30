import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import {
  schema,
  getDb,
  generateDek,
  encryptWithDek,
  wrapDek,
  unwrapDek,
  decryptWithDek,
} from '@ilinga/db';
import { requireAuth, requireCsrf, requireTenantMembership, requireRole } from '../lib/guard.js';
import { badRequest, notFound } from '../lib/problem.js';
import { signWebhookBody } from '../lib/webhooks/sign.js';
import { generateToken } from '../lib/crypto.js';

export const webhookRoutes = new Hono();
webhookRoutes.use('*', requireAuth);
webhookRoutes.use('*', requireCsrf);

const Create = z.object({
  url: z.string().url(),
  events: z.array(z.string().min(2).max(80)).min(1).max(50),
});

webhookRoutes.post(
  '/tenant/:tid',
  requireTenantMembership('tid'),
  requireRole('owner', 'admin'),
  async (c) => {
    const body = Create.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw badRequest('invalid body');
    const tenantId = c.req.param('tid');
    const db = getDb();
    const dek = generateDek();
    const [dekRow] = await db
      .insert(schema.tenantDeks)
      .values({ tenantId, wrappedDek: wrapDek(dek) })
      .returning({ id: schema.tenantDeks.id });
    const secret = generateToken(32);
    const ciphertext = encryptWithDek(dek, secret);
    const [endpoint] = await db
      .insert(schema.webhookEndpoints)
      .values({
        tenantId,
        url: body.data.url,
        secretCiphertext: ciphertext,
        secretDekId: dekRow!.id,
        events: body.data.events,
      })
      .returning({ id: schema.webhookEndpoints.id });
    return c.json({ id: endpoint!.id, secret }, 201);
  },
);

webhookRoutes.get('/tenant/:tid', requireTenantMembership('tid'), async (c) => {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.webhookEndpoints.id,
      url: schema.webhookEndpoints.url,
      events: schema.webhookEndpoints.events,
      isActive: schema.webhookEndpoints.isActive,
      createdAt: schema.webhookEndpoints.createdAt,
    })
    .from(schema.webhookEndpoints)
    .where(eq(schema.webhookEndpoints.tenantId, c.req.param('tid')))
    .orderBy(desc(schema.webhookEndpoints.createdAt));
  return c.json({ endpoints: rows });
});

webhookRoutes.post(
  '/tenant/:tid/:eid/rotate',
  requireTenantMembership('tid'),
  requireRole('owner', 'admin'),
  async (c) => {
    const db = getDb();
    const tenantId = c.req.param('tid');
    const id = c.req.param('eid');
    const rows = await db
      .select()
      .from(schema.webhookEndpoints)
      .where(
        and(eq(schema.webhookEndpoints.id, id), eq(schema.webhookEndpoints.tenantId, tenantId)),
      )
      .limit(1);
    const e = rows[0];
    if (!e) throw notFound();
    const dekRows = await db
      .select()
      .from(schema.tenantDeks)
      .where(eq(schema.tenantDeks.id, e.secretDekId))
      .limit(1);
    if (!dekRows[0]) throw notFound('dek');
    const dek = unwrapDek(dekRows[0].wrappedDek as Buffer);
    const newSecret = generateToken(32);
    await db
      .update(schema.webhookEndpoints)
      .set({
        previousSecretCiphertext: e.secretCiphertext as Buffer,
        previousSecretValidUntil: new Date(Date.now() + 24 * 3_600_000),
        secretCiphertext: encryptWithDek(dek, newSecret),
      })
      .where(eq(schema.webhookEndpoints.id, e.id));
    return c.json({ secret: newSecret, gracePeriodHours: 24 });
  },
);

webhookRoutes.post(
  '/tenant/:tid/:eid/test',
  requireTenantMembership('tid'),
  requireRole('owner', 'admin'),
  async (c) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.id, c.req.param('eid')))
      .limit(1);
    const e = rows[0];
    if (!e) throw notFound();
    const dekRows = await db
      .select()
      .from(schema.tenantDeks)
      .where(eq(schema.tenantDeks.id, e.secretDekId))
      .limit(1);
    if (!dekRows[0]) throw notFound('dek');
    const dek = unwrapDek(dekRows[0].wrappedDek as Buffer);
    const secret = decryptWithDek(dek, e.secretCiphertext as Buffer);
    const payload = JSON.stringify({ id: 'evt_test', type: 'test', data: { hello: 'world' } });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signWebhookBody(secret, payload),
    };
    if (
      e.previousSecretCiphertext &&
      e.previousSecretValidUntil &&
      e.previousSecretValidUntil > new Date()
    ) {
      const oldSecret = decryptWithDek(dek, e.previousSecretCiphertext as Buffer);
      headers['X-Webhook-Signature-Old'] = signWebhookBody(oldSecret, payload);
    }
    let ok = false;
    let status = 0;
    let lastBody = '';
    try {
      const res = await fetch(e.url, { method: 'POST', headers, body: payload });
      status = res.status;
      ok = res.ok;
      lastBody = (await res.text()).slice(0, 4000);
    } catch (err) {
      ok = false;
      lastBody = (err as Error).message;
    }
    await db.insert(schema.webhookDeliveries).values({
      tenantId: e.tenantId,
      endpointId: e.id,
      eventType: 'test',
      payload: { hello: 'world' },
      requestSignature: headers['X-Webhook-Signature'],
      status: ok ? 'delivered' : 'failed',
      attempts: 1,
      lastResponseStatus: status,
      lastResponseBody: lastBody,
      deliveredAt: ok ? new Date() : null,
    });
    return c.json({ ok, status });
  },
);

webhookRoutes.get('/tenant/:tid/:eid/deliveries', requireTenantMembership('tid'), async (c) => {
  const rows = await getDb()
    .select()
    .from(schema.webhookDeliveries)
    .where(
      and(
        eq(schema.webhookDeliveries.tenantId, c.req.param('tid')),
        eq(schema.webhookDeliveries.endpointId, c.req.param('eid')),
      ),
    )
    .orderBy(desc(schema.webhookDeliveries.createdAt))
    .limit(100);
  return c.json({ deliveries: rows });
});

webhookRoutes.post(
  '/tenant/:tid/:eid/deliveries/:did/replay',
  requireTenantMembership('tid'),
  requireRole('owner', 'admin'),
  async (c) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.webhookDeliveries)
      .where(eq(schema.webhookDeliveries.id, c.req.param('did')))
      .limit(1);
    const original = rows[0];
    if (!original) throw notFound();
    const endpoints = await db
      .select()
      .from(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.id, original.endpointId))
      .limit(1);
    const e = endpoints[0];
    if (!e) throw notFound();
    const dekRows = await db
      .select()
      .from(schema.tenantDeks)
      .where(eq(schema.tenantDeks.id, e.secretDekId))
      .limit(1);
    if (!dekRows[0]) throw notFound('dek');
    const dek = unwrapDek(dekRows[0].wrappedDek as Buffer);
    const secret = decryptWithDek(dek, e.secretCiphertext as Buffer);
    const payload = JSON.stringify(original.payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signWebhookBody(secret, payload),
      'X-Webhook-Replay-Of': original.id,
    };
    let ok = false;
    let status = 0;
    let lastBody = '';
    try {
      const res = await fetch(e.url, { method: 'POST', headers, body: payload });
      status = res.status;
      ok = res.ok;
      lastBody = (await res.text()).slice(0, 4000);
    } catch (err) {
      lastBody = (err as Error).message;
    }
    await db.insert(schema.webhookDeliveries).values({
      tenantId: e.tenantId,
      endpointId: e.id,
      eventType: original.eventType,
      payload: original.payload,
      requestSignature: headers['X-Webhook-Signature'],
      status: ok ? 'delivered' : 'failed',
      attempts: 1,
      lastResponseStatus: status,
      lastResponseBody: lastBody,
      deliveredAt: ok ? new Date() : null,
    });
    return c.json({ ok, status });
  },
);
