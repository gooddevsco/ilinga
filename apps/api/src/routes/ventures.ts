import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { requireAuth, requireCsrf, requireTenantMembership } from '../lib/guard.js';
import {
  cloneCycle,
  closeCycle,
  createVenture,
  cycleSummary,
  getVenture,
  listVentures,
  softDeleteVenture,
  updateBrief,
} from '../lib/ventures/service.js';
import { badRequest, notFound } from '../lib/problem.js';

export const ventureRoutes = new Hono();

ventureRoutes.use('*', requireAuth);
ventureRoutes.use('*', requireCsrf);

const Create = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(2).max(80),
  industry: z.string().max(80).optional(),
  geos: z.array(z.string().length(2)).max(20).optional(),
  brief: z.record(z.unknown()).optional(),
});

ventureRoutes.post('/', async (c) => {
  const body = Create.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest('invalid body');
  const userId = c.get('userId') as string;
  const created = await createVenture(body.data.tenantId, userId, body.data);
  return c.json(created, 201);
});

ventureRoutes.get('/tenant/:tid', requireTenantMembership('tid'), async (c) => {
  const ventures = await listVentures(c.req.param('tid'));
  return c.json({ ventures });
});

ventureRoutes.get('/tenant/:tid/:vid', requireTenantMembership('tid'), async (c) => {
  const v = await getVenture(c.req.param('tid'), c.req.param('vid'));
  if (!v) throw notFound();
  return c.json({ venture: v });
});

ventureRoutes.get('/tenant/:tid/:vid/cycles', requireTenantMembership('tid'), async (c) => {
  const rows = await getDb()
    .select()
    .from(schema.ventureCycles)
    .where(
      and(
        eq(schema.ventureCycles.tenantId, c.req.param('tid')),
        eq(schema.ventureCycles.ventureId, c.req.param('vid')),
      ),
    )
    .orderBy(desc(schema.ventureCycles.seq));
  return c.json({ cycles: rows });
});

const BriefBody = z.object({ brief: z.record(z.unknown()) });
ventureRoutes.patch('/tenant/:tid/:vid/brief', requireTenantMembership('tid'), async (c) => {
  const body = BriefBody.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest('invalid body');
  await updateBrief(c.req.param('tid'), c.req.param('vid'), body.data.brief);
  return c.json({ ok: true });
});

ventureRoutes.delete('/tenant/:tid/:vid', requireTenantMembership('tid'), async (c) => {
  await softDeleteVenture(c.req.param('tid'), c.req.param('vid'), c.get('userId') as string);
  return c.json({ ok: true, restoreWindowDays: 30 });
});

const CloneBody = z.object({ cycleId: z.string().uuid() });
ventureRoutes.post('/tenant/:tid/cycles/clone', requireTenantMembership('tid'), async (c) => {
  const body = CloneBody.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest('invalid body');
  const created = await cloneCycle(
    c.req.param('tid'),
    c.get('userId') as string,
    body.data.cycleId,
  );
  return c.json(created, 201);
});

ventureRoutes.post('/tenant/:tid/cycles/:cid/close', requireTenantMembership('tid'), async (c) => {
  await closeCycle(c.req.param('tid'), c.req.param('cid'));
  return c.json({ ok: true });
});

ventureRoutes.get('/tenant/:tid/cycles/:cid/summary', requireTenantMembership('tid'), async (c) => {
  const summary = await cycleSummary(c.req.param('tid'), c.req.param('cid'));
  return c.json(summary);
});

ventureRoutes.get('/tenant/:tid/cycles/compare', requireTenantMembership('tid'), async (c) => {
  const a = c.req.query('a');
  const b = c.req.query('b');
  if (!a || !b) throw badRequest('require ?a=<cycleId>&b=<cycleId>');
  const [sa, sb] = await Promise.all([
    cycleSummary(c.req.param('tid'), a),
    cycleSummary(c.req.param('tid'), b),
  ]);
  // join keys by code so the UI can render side-by-side rows
  const byCode = new Map<string, { a?: unknown; b?: unknown }>();
  for (const k of sa.contentKeys) byCode.set(k.code, { ...byCode.get(k.code), a: k.value });
  for (const k of sb.contentKeys) byCode.set(k.code, { ...byCode.get(k.code), b: k.value });
  return c.json({
    a: sa,
    b: sb,
    diff: Array.from(byCode.entries()).map(([code, value]) => ({ code, ...value })),
  });
});
