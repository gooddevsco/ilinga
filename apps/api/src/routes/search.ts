import { Hono } from 'hono';
import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { requireAuth, requireCsrf, requireTenantMembership } from '../lib/guard.js';

export const searchRoutes = new Hono();
searchRoutes.use('*', requireAuth);
searchRoutes.use('*', requireCsrf);

searchRoutes.get('/tenant/:tid', requireTenantMembership('tid'), async (c) => {
  const tenantId = c.req.param('tid');
  const q = (c.req.query('q') ?? '').trim();
  if (!q) return c.json({ ventures: [], reports: [], keys: [] });
  const db = getDb();
  const like = `%${q.replace(/[%_]/g, '')}%`;
  const [ventures, reports, keys] = await Promise.all([
    db
      .select({ id: schema.ventures.id, name: schema.ventures.name })
      .from(schema.ventures)
      .where(and(eq(schema.ventures.tenantId, tenantId), ilike(schema.ventures.name, like)))
      .limit(20),
    db
      .select({ id: schema.reports.id, title: schema.reports.title })
      .from(schema.reports)
      .where(and(eq(schema.reports.tenantId, tenantId), ilike(schema.reports.title, like)))
      .limit(20),
    db
      .select({ id: schema.contentKeys.id, code: schema.contentKeys.code })
      .from(schema.contentKeys)
      .where(
        and(
          eq(schema.contentKeys.tenantId, tenantId),
          or(
            ilike(schema.contentKeys.code, like),
            sql`cast(${schema.contentKeys.value} as text) ilike ${like}`,
          ),
        ),
      )
      .limit(20),
  ]);
  return c.json({ ventures, reports, keys });
});
