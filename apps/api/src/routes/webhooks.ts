import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { schema, getDb, generateDek, encryptWithDek, wrapDek, unwrapDek, decryptWithDek } from '@ilinga/db';
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

webhookRoutes.get(
  '/tenant/:tid',
  requireTenantMembership('tid'),
  async (c) => {
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
  },
);

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
      .where(and(eq(schema.webhookEndpoints.id, id), eq(schema.webhookEndpoints.tenantId, tenantId)))
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
    if (e.previousSecretCiphertext && e.previousSecretValidUntil && e.previousSecretValidUntil > new Date()) {
      const oldSecret = decryptWithDek(dek, e.previousSecretCiphertext as Buffer);
      headers['X-Webhook-Signature-Old'] = signWebhookBody(oldSecret, payload);
    }
    let ok = false;
    let status = 0;
    try {
      const res = await fetch(e.url, { method: 'POST', headers, body: payload });
      status = res.status;
      ok = res.ok;
    } catch {
      ok = false;
    }
    return c.json({ ok, status });
  },
);
