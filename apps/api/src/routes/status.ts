import { Hono } from 'hono';
import { and, gt, lt, eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';

export const statusRoutes = new Hono();

statusRoutes.get('/', async (c) => {
  const db = getDb();
  const now = new Date();
  const inWindow = await db
    .select()
    .from(schema.maintenanceWindows)
    .where(
      and(
        eq(schema.maintenanceWindows.published, true),
        lt(schema.maintenanceWindows.startsAt, now),
        gt(schema.maintenanceWindows.endsAt, now),
      ),
    )
    .limit(1);
  const incidents = await db
    .select()
    .from(schema.platformIncidents)
    .where(eq(schema.platformIncidents.status, 'investigating'))
    .limit(20);
  const components = [
    { name: 'API', status: 'operational' },
    { name: 'Web app', status: 'operational' },
    { name: 'Render workers', status: 'operational' },
    { name: 'Email delivery', status: 'operational' },
    { name: 'Object storage', status: 'operational' },
  ];
  return c.json({
    ok: true,
    maintenance: inWindow[0] ?? null,
    components,
    incidents,
  });
});
