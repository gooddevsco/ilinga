import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { requireAuth, requireCsrf, requireTenantMembership } from '../lib/guard.js';
import { badRequest } from '../lib/problem.js';
import { scrapeQueue } from '../lib/queues.js';

export const competitorRoutes = new Hono();
competitorRoutes.use('*', requireAuth);
competitorRoutes.use('*', requireCsrf);

const Add = z.object({
  cycleId: z.string().uuid(),
  url: z.string().url().max(2048),
  label: z.string().max(120).optional(),
});

competitorRoutes.post('/tenant/:tid', requireTenantMembership('tid'), async (c) => {
  const body = Add.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest(body.error.message);
  const tenantId = c.req.param('tid');
  const userId = c.get('userId') as string;
  const [row] = await getDb()
    .insert(schema.competitors)
    .values({
      tenantId,
      cycleId: body.data.cycleId,
      url: body.data.url,
      label: body.data.label ?? null,
      scrapeStatus: 'queued',
      addedBy: userId,
    })
    .returning({ id: schema.competitors.id });
  if (!row) throw new Error('insert failed');
  await scrapeQueue.add(
    'scrape',
    { competitorId: row.id, url: body.data.url, tenantId, cycleId: body.data.cycleId },
    { jobId: `scrape-${row.id}`, removeOnComplete: 100, removeOnFail: 100 },
  );
  return c.json({ id: row.id }, 201);
});

competitorRoutes.get('/tenant/:tid/cycle/:cid', requireTenantMembership('tid'), async (c) => {
  const rows = await getDb()
    .select()
    .from(schema.competitors)
    .where(
      and(
        eq(schema.competitors.tenantId, c.req.param('tid')),
        eq(schema.competitors.cycleId, c.req.param('cid')),
      ),
    )
    .orderBy(desc(schema.competitors.createdAt));
  return c.json({ competitors: rows });
});

competitorRoutes.delete('/tenant/:tid/:cid', requireTenantMembership('tid'), async (c) => {
  await getDb()
    .delete(schema.competitors)
    .where(
      and(
        eq(schema.competitors.id, c.req.param('cid')),
        eq(schema.competitors.tenantId, c.req.param('tid')),
      ),
    );
  return c.json({ ok: true });
});
