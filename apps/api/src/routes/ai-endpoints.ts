import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { schema, getDb, generateDek, wrapDek, encryptWithDek } from '@ilinga/db';
import { requireAuth, requireCsrf, requireTenantMembership, requireRole } from '../lib/guard.js';
import { badRequest } from '../lib/problem.js';

export const aiEndpointRoutes = new Hono();
aiEndpointRoutes.use('*', requireAuth);
aiEndpointRoutes.use('*', requireCsrf);

aiEndpointRoutes.get('/tenant/:tid', requireTenantMembership('tid'), async (c) => {
  const rows = await getDb()
    .select({
      id: schema.tenantAiEndpoints.id,
      label: schema.tenantAiEndpoints.label,
      modelId: schema.tenantAiEndpoints.modelId,
      baseUrl: schema.tenantAiEndpoints.baseUrl,
      apiKeyLastFour: schema.tenantAiEndpoints.apiKeyLastFour,
      workloads: schema.tenantAiEndpoints.workloads,
      isDefault: schema.tenantAiEndpoints.isDefault,
      createdAt: schema.tenantAiEndpoints.createdAt,
    })
    .from(schema.tenantAiEndpoints)
    .where(eq(schema.tenantAiEndpoints.tenantId, c.req.param('tid')))
    .orderBy(desc(schema.tenantAiEndpoints.createdAt));
  return c.json({ endpoints: rows });
});

aiEndpointRoutes.get('/models', async (c) => {
  const rows = await getDb()
    .select({
      id: schema.aiModels.id,
      provider: schema.aiModels.provider,
      modelId: schema.aiModels.modelId,
      displayName: schema.aiModels.displayName,
      capabilities: schema.aiModels.capabilities,
    })
    .from(schema.aiModels)
    .where(eq(schema.aiModels.isActive, true));
  return c.json({ models: rows });
});

const Create = z.object({
  modelId: z.string().uuid(),
  label: z.string().min(2).max(80),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(8).max(512),
  workloads: z.array(z.string().min(2).max(64)).default([]),
});

aiEndpointRoutes.post(
  '/tenant/:tid',
  requireTenantMembership('tid'),
  requireRole('owner', 'admin'),
  async (c) => {
    const body = Create.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw badRequest('invalid body');
    const tenantId = c.req.param('tid');
    const db = getDb();
    const dek = generateDek();
    const [dekRow] = await db
      .insert(schema.tenantDeks)
      .values({ tenantId, wrappedDek: wrapDek(dek) })
      .returning({ id: schema.tenantDeks.id });
    const ciphertext = encryptWithDek(dek, body.data.apiKey);
    const [endpoint] = await db
      .insert(schema.tenantAiEndpoints)
      .values({
        tenantId,
        modelId: body.data.modelId,
        label: body.data.label,
        baseUrl: body.data.baseUrl ?? null,
        apiKeyCiphertext: ciphertext,
        apiKeyDekId: dekRow!.id,
        apiKeyLastFour: body.data.apiKey.slice(-4),
        workloads: body.data.workloads,
      })
      .returning({ id: schema.tenantAiEndpoints.id });
    return c.json({ id: endpoint!.id }, 201);
  },
);

aiEndpointRoutes.delete(
  '/tenant/:tid/:id',
  requireTenantMembership('tid'),
  requireRole('owner', 'admin'),
  async (c) => {
    await getDb()
      .update(schema.tenantAiEndpoints)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(schema.tenantAiEndpoints.id, c.req.param('id')),
          eq(schema.tenantAiEndpoints.tenantId, c.req.param('tid')),
        ),
      );
    return c.json({ ok: true });
  },
);
