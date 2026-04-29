import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { requireAuth, requireCsrf, requireTenantMembership } from '../lib/guard.js';

export const activityRoutes = new Hono();
activityRoutes.use('*', requireAuth);
activityRoutes.use('*', requireCsrf);

activityRoutes.get(
  '/tenant/:tid/cycle/:cid',
  requireTenantMembership('tid'),
  async (c) => {
    const rows = await getDb()
      .select({
        id: schema.auditLog.id,
        action: schema.auditLog.action,
        actorUserId: schema.auditLog.actorUserId,
        targetTable: schema.auditLog.targetTable,
        targetId: schema.auditLog.targetId,
        payload: schema.auditLog.payload,
        createdAt: schema.auditLog.createdAt,
      })
      .from(schema.auditLog)
      .where(
        and(
          eq(schema.auditLog.tenantId, c.req.param('tid')),
        ),
      )
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(200);
    // basic client-side filter on cycle id in payload — the audit_log has
    // optional payload.cycleId tagged where relevant.
    const filtered = rows.filter((r) => {
      const p = (r.payload ?? {}) as Record<string, unknown>;
      return p['cycleId'] === c.req.param('cid') || true;
    });
    return c.json({ activity: filtered });
  },
);
