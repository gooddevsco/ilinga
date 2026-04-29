import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, requireCsrf, requireTenantMembership } from '../lib/guard.js';
import {
  cloneCycle,
  createVenture,
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
  const created = await cloneCycle(c.req.param('tid'), c.get('userId') as string, body.data.cycleId);
  return c.json(created, 201);
});
