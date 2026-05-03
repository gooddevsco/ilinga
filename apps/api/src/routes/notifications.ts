import { Hono } from 'hono';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { requireAuth, requireCsrf } from '../lib/guard.js';

export const notificationRoutes = new Hono();
notificationRoutes.use('*', requireAuth);
notificationRoutes.use('*', requireCsrf);

notificationRoutes.get('/', async (c) => {
  const userId = c.get('userId') as string;
  const rows = await getDb()
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, userId))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(100);
  return c.json({ notifications: rows });
});

notificationRoutes.post('/:id/read', async (c) => {
  const userId = c.get('userId') as string;
  await getDb()
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.notifications.id, c.req.param('id')),
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.readAt),
      ),
    );
  return c.json({ ok: true });
});

notificationRoutes.post('/read-all', async (c) => {
  const userId = c.get('userId') as string;
  await getDb()
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(eq(schema.notifications.userId, userId), isNull(schema.notifications.readAt)));
  return c.json({ ok: true });
});
