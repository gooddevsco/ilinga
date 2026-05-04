import { Hono } from 'hono';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { requireAuth, requireCsrf } from '../lib/guard.js';
import { revokeAllForUser } from '../lib/auth/sessions.js';

export const sessionRoutes = new Hono();
sessionRoutes.use('*', requireAuth);
sessionRoutes.use('*', requireCsrf);

sessionRoutes.get('/', async (c) => {
  const userId = c.get('userId') as string;
  const rows = await getDb()
    .select({
      id: schema.userSessions.id,
      ip: schema.userSessions.ip,
      userAgent: schema.userSessions.userAgent,
      createdAt: schema.userSessions.createdAt,
      lastSeenAt: schema.userSessions.lastSeenAt,
      expiresAt: schema.userSessions.expiresAt,
      revokedAt: schema.userSessions.revokedAt,
    })
    .from(schema.userSessions)
    .where(eq(schema.userSessions.userId, userId))
    .orderBy(desc(schema.userSessions.lastSeenAt))
    .limit(50);
  return c.json({ sessions: rows });
});

sessionRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId') as string;
  await getDb()
    .update(schema.userSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(schema.userSessions.id, c.req.param('id')),
        eq(schema.userSessions.userId, userId),
        isNull(schema.userSessions.revokedAt),
      ),
    );
  return c.json({ ok: true });
});

sessionRoutes.post('/revoke-all', async (c) => {
  const userId = c.get('userId') as string;
  await revokeAllForUser(userId);
  return c.json({ ok: true });
});

sessionRoutes.get('/devices', async (c) => {
  const userId = c.get('userId') as string;
  const rows = await getDb()
    .select({
      id: schema.userTrustedDevices.id,
      label: schema.userTrustedDevices.label,
      lastSeenAt: schema.userTrustedDevices.lastSeenAt,
      expiresAt: schema.userTrustedDevices.expiresAt,
      revokedAt: schema.userTrustedDevices.revokedAt,
      impossibleTravelFlagged: schema.userTrustedDevices.impossibleTravelFlagged,
    })
    .from(schema.userTrustedDevices)
    .where(eq(schema.userTrustedDevices.userId, userId))
    .orderBy(desc(schema.userTrustedDevices.lastSeenAt))
    .limit(50);
  return c.json({ devices: rows });
});

sessionRoutes.delete('/devices/:id', async (c) => {
  const userId = c.get('userId') as string;
  await getDb()
    .update(schema.userTrustedDevices)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(schema.userTrustedDevices.id, c.req.param('id')),
        eq(schema.userTrustedDevices.userId, userId),
        isNull(schema.userTrustedDevices.revokedAt),
      ),
    );
  return c.json({ ok: true });
});
