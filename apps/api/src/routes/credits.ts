import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { requireAuth, requireCsrf, requireTenantMembership } from '../lib/guard.js';

export const creditRoutes = new Hono();
creditRoutes.use('*', requireAuth);
creditRoutes.use('*', requireCsrf);

creditRoutes.get('/tenant/:tid/ledger', requireTenantMembership('tid'), async (c) => {
  const rows = await getDb()
    .select()
    .from(schema.creditLedger)
    .where(eq(schema.creditLedger.tenantId, c.req.param('tid')))
    .orderBy(desc(schema.creditLedger.createdAt))
    .limit(200);
  return c.json({ ledger: rows });
});

creditRoutes.get('/tenant/:tid/usage', requireTenantMembership('tid'), async (c) => {
  const since = c.req.query('since')
    ? new Date(c.req.query('since') as string)
    : new Date(Date.now() - 30 * 86_400_000);
  const rows = await getDb()
    .select()
    .from(schema.creditLedger)
    .where(
      and(eq(schema.creditLedger.tenantId, c.req.param('tid'))),
    )
    .orderBy(desc(schema.creditLedger.createdAt))
    .limit(2000);
  const filtered = rows.filter((r) => r.createdAt >= since);
  const byReason = new Map<string, number>();
  for (const r of filtered) {
    if (r.delta < 0) byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + Math.abs(r.delta));
  }
  return c.json({
    since: since.toISOString(),
    totalSpent: Array.from(byReason.values()).reduce((a, b) => a + b, 0),
    byReason: Object.fromEntries(byReason),
  });
});
