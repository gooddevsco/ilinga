import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { requireAuth, requireCsrf, requireTenantMembership, requireRole } from '../lib/guard.js';
import { issuePat, revokePat } from '../lib/api-tokens/service.js';
import { badRequest } from '../lib/problem.js';

export const tokenRoutes = new Hono();
tokenRoutes.use('*', requireAuth);
tokenRoutes.use('*', requireCsrf);

const Issue = z.object({
  label: z.string().min(2).max(80),
  scopes: z.array(z.string().min(2).max(64)).min(1).max(20),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

tokenRoutes.post(
  '/tenant/:tid',
  requireTenantMembership('tid'),
  requireRole('owner', 'admin'),
  async (c) => {
    const body = Issue.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw badRequest('invalid body');
    const expiresAt = body.data.expiresInDays
      ? new Date(Date.now() + body.data.expiresInDays * 86_400_000)
      : null;
    const issued = await issuePat({
      tenantId: c.req.param('tid'),
      userId: c.get('userId') as string,
      label: body.data.label,
      scopes: body.data.scopes,
      expiresAt,
    });
    return c.json({ id: issued.id, prefix: issued.prefix, raw: issued.raw }, 201);
  },
);

tokenRoutes.get('/tenant/:tid', requireTenantMembership('tid'), async (c) => {
  const rows = await getDb()
    .select({
      id: schema.apiTokens.id,
      label: schema.apiTokens.label,
      prefix: schema.apiTokens.tokenPrefix,
      scopes: schema.apiTokens.scopes,
      createdAt: schema.apiTokens.createdAt,
      expiresAt: schema.apiTokens.expiresAt,
      revokedAt: schema.apiTokens.revokedAt,
      lastUsedAt: schema.apiTokens.lastUsedAt,
    })
    .from(schema.apiTokens)
    .where(eq(schema.apiTokens.tenantId, c.req.param('tid')));
  return c.json({ tokens: rows });
});

tokenRoutes.delete(
  '/tenant/:tid/:id',
  requireTenantMembership('tid'),
  requireRole('owner', 'admin'),
  async (c) => {
    await revokePat(c.req.param('id'));
    return c.json({ ok: true });
  },
);
