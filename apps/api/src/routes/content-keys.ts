import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq, sql } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { requireAuth, requireCsrf, requireTenantMembership } from '../lib/guard.js';
import { badRequest } from '../lib/problem.js';
import { appendAudit } from '../lib/audit/log.js';

export const contentKeyRoutes = new Hono();
contentKeyRoutes.use('*', requireAuth);
contentKeyRoutes.use('*', requireCsrf);

contentKeyRoutes.get('/tenant/:tid/cycle/:cid', requireTenantMembership('tid'), async (c) => {
  // Latest version per code.
  const rows = await getDb()
    .select()
    .from(schema.contentKeys)
    .where(
      and(
        eq(schema.contentKeys.tenantId, c.req.param('tid')),
        eq(schema.contentKeys.cycleId, c.req.param('cid')),
      ),
    )
    .orderBy(desc(schema.contentKeys.version));
  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    if (!latest.has(r.code)) latest.set(r.code, r);
  }
  return c.json({ keys: Array.from(latest.values()) });
});

const Override = z.object({
  cycleId: z.string().uuid(),
  code: z.string().min(2).max(120),
  value: z.unknown(),
});

contentKeyRoutes.post('/tenant/:tid/override', requireTenantMembership('tid'), async (c) => {
  const body = Override.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest('invalid body');
  const tenantId = c.req.param('tid');
  const userId = c.get('userId') as string;
  const db = getDb();

  const [next] = await db
    .select({ next: sql<number>`coalesce(max(version), 0) + 1` })
    .from(schema.contentKeys)
    .where(
      and(
        eq(schema.contentKeys.tenantId, tenantId),
        eq(schema.contentKeys.cycleId, body.data.cycleId),
        eq(schema.contentKeys.code, body.data.code),
      ),
    );
  const version = next?.next ?? 1;
  const [created] = await db
    .insert(schema.contentKeys)
    .values({
      tenantId,
      cycleId: body.data.cycleId,
      code: body.data.code,
      version,
      value: (body.data.value ?? null) as never,
      confidence: 100,
      source: 'manual',
    })
    .returning({ id: schema.contentKeys.id, version: schema.contentKeys.version });
  await appendAudit({
    tenantId,
    actorUserId: userId,
    action: 'content_key.manual_override',
    targetTable: 'content_keys',
    targetId: created!.id,
    payload: { cycleId: body.data.cycleId, code: body.data.code, version: created!.version },
    requestId: c.get('requestId') as string | null,
  });
  return c.json({ id: created!.id, version: created!.version }, 201);
});
