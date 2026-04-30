import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { requireAuth, requireCsrf } from '../lib/guard.js';
import { badRequest, forbidden } from '../lib/problem.js';
import { appendAudit } from '../lib/audit/log.js';

export const adminRoutes = new Hono();
adminRoutes.use('*', requireAuth);
adminRoutes.use('*', requireCsrf);

const requirePlatformAdmin = async (userId: string): Promise<void> => {
  const rows = await getDb()
    .select()
    .from(schema.platformAdmins)
    .where(eq(schema.platformAdmins.userId, userId))
    .limit(1);
  if (!rows[0]) throw forbidden('platform admin only');
};

const Dsar = z.object({
  kind: z.enum(['access', 'rectification', 'erasure', 'portability', 'restriction']),
  description: z.string().max(8000).optional(),
  tenantId: z.string().uuid().optional(),
});

adminRoutes.post('/dsar', async (c) => {
  const body = Dsar.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest('invalid body');
  const userId = c.get('userId') as string;
  const db = getDb();
  await db.insert(schema.dsarRequests).values({
    userId,
    tenantId: body.data.tenantId ?? null,
    kind: body.data.kind,
    description: body.data.description ?? null,
  });
  await appendAudit({
    tenantId: body.data.tenantId ?? null,
    actorUserId: userId,
    action: `dsar.${body.data.kind}.requested`,
    requestId: c.get('requestId') as string | null,
  });
  return c.json({ ok: true }, 201);
});

adminRoutes.get('/dsar', async (c) => {
  const userId = c.get('userId') as string;
  await requirePlatformAdmin(userId);
  const rows = await getDb().select().from(schema.dsarRequests).limit(200);
  return c.json({ requests: rows });
});

const Resolve = z.object({ resolution: z.string().min(2).max(8000) });

adminRoutes.post('/dsar/:id/resolve', async (c) => {
  const userId = c.get('userId') as string;
  await requirePlatformAdmin(userId);
  const body = Resolve.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest('invalid body');
  const db = getDb();
  await db
    .update(schema.dsarRequests)
    .set({
      status: 'resolved',
      resolution: body.data.resolution,
      assignedAdminId: userId,
      resolvedAt: new Date(),
    })
    .where(eq(schema.dsarRequests.id, c.req.param('id')));
  await appendAudit({
    actorUserId: userId,
    action: 'dsar.resolved',
    targetTable: 'dsar_requests',
    targetId: c.req.param('id'),
    requestId: c.get('requestId') as string | null,
  });
  return c.json({ ok: true });
});

const Maintenance = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  message: z.string().min(2).max(500),
  severity: z.enum(['info', 'warning']).default('info'),
  affectsComponents: z.array(z.string()).max(10).default([]),
  published: z.boolean().default(true),
});

adminRoutes.post('/maintenance', async (c) => {
  const userId = c.get('userId') as string;
  await requirePlatformAdmin(userId);
  const body = Maintenance.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest('invalid body');
  const db = getDb();
  const [row] = await db
    .insert(schema.maintenanceWindows)
    .values({
      startsAt: new Date(body.data.startsAt),
      endsAt: new Date(body.data.endsAt),
      message: body.data.message,
      severity: body.data.severity,
      affectsComponents: body.data.affectsComponents,
      published: body.data.published,
      createdBy: userId,
    })
    .returning({ id: schema.maintenanceWindows.id });
  return c.json({ id: row!.id }, 201);
});

adminRoutes.get('/maintenance', async (c) => {
  const userId = c.get('userId') as string;
  await requirePlatformAdmin(userId);
  const { desc } = await import('drizzle-orm');
  const rows = await getDb()
    .select()
    .from(schema.maintenanceWindows)
    .orderBy(desc(schema.maintenanceWindows.startsAt))
    .limit(200);
  return c.json({ windows: rows });
});

adminRoutes.delete('/maintenance/:id', async (c) => {
  const userId = c.get('userId') as string;
  await requirePlatformAdmin(userId);
  await getDb()
    .delete(schema.maintenanceWindows)
    .where(eq(schema.maintenanceWindows.id, c.req.param('id')));
  return c.json({ ok: true });
});

const Impersonate = z.object({
  impersonatedUserId: z.string().uuid(),
  tenantId: z.string().uuid(),
  reason: z.string().min(2).max(500),
});

adminRoutes.post('/impersonate', async (c) => {
  const userId = c.get('userId') as string;
  await requirePlatformAdmin(userId);
  const body = Impersonate.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest('invalid body');
  const db = getDb();
  const [row] = await db
    .insert(schema.impersonationSessions)
    .values({
      adminUserId: userId,
      impersonatedUserId: body.data.impersonatedUserId,
      tenantId: body.data.tenantId,
      reason: body.data.reason,
      ip: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: c.req.header('user-agent') ?? null,
    })
    .returning({ id: schema.impersonationSessions.id });
  await appendAudit({
    tenantId: body.data.tenantId,
    actorUserId: userId,
    impersonatorUserId: userId,
    action: 'admin.impersonate.start',
    payload: { reason: body.data.reason, target: body.data.impersonatedUserId },
    requestId: c.get('requestId') as string | null,
  });
  return c.json({ id: row!.id }, 201);
});
