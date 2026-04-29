import { Hono } from 'hono';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { requireAuth, requireCsrf, requireTenantMembership, requireRole } from '../lib/guard.js';

export const trashRoutes = new Hono();
trashRoutes.use('*', requireAuth);
trashRoutes.use('*', requireCsrf);

trashRoutes.get('/tenant/:tid', requireTenantMembership('tid'), async (c) => {
  const rows = await getDb()
    .select()
    .from(schema.deletionTombstones)
    .where(
      and(
        eq(schema.deletionTombstones.tenantId, c.req.param('tid')),
        isNull(schema.deletionTombstones.hardDeletedAt),
        gt(schema.deletionTombstones.restoreDeadline, new Date()),
      ),
    )
    .orderBy(desc(schema.deletionTombstones.deletedAt));
  return c.json({ items: rows });
});

trashRoutes.post(
  '/tenant/:tid/restore/:id',
  requireTenantMembership('tid'),
  requireRole('owner', 'admin'),
  async (c) => {
    const id = c.req.param('id');
    const db = getDb();
    const t = await db
      .select()
      .from(schema.deletionTombstones)
      .where(eq(schema.deletionTombstones.id, id))
      .limit(1);
    if (!t[0]) return c.json({ ok: false }, 404);
    if (t[0].targetTable === 'ventures') {
      await db
        .update(schema.ventures)
        .set({ deletedAt: null })
        .where(eq(schema.ventures.id, t[0].targetId));
    } else if (t[0].targetTable === 'tenants') {
      await db
        .update(schema.tenants)
        .set({ deletedAt: null })
        .where(eq(schema.tenants.id, t[0].targetId));
    }
    await db
      .update(schema.deletionTombstones)
      .set({ hardDeletedAt: new Date() })
      .where(eq(schema.deletionTombstones.id, id));
    return c.json({ ok: true });
  },
);
