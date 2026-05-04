import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq, isNull } from 'drizzle-orm';
import {
  schema,
  getDb,
  generateDek,
  wrapDek,
  encryptWithDek,
  decryptWithDek,
  unwrapDek,
} from '@ilinga/db';
import { requireAuth, requireCsrf, requireTenantMembership, requireRole } from '../lib/guard.js';
import { badRequest, notFound } from '../lib/problem.js';
import { openAiProvider } from '../lib/ai/openai.js';
import { anthropicProvider } from '../lib/ai/anthropic.js';

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

const DryRun = z.object({
  prompt: z.string().min(1).max(2000).default('Reply with a single word: pong.'),
});

aiEndpointRoutes.post(
  '/tenant/:tid/:id/dry-run',
  requireTenantMembership('tid'),
  requireRole('owner', 'admin'),
  async (c) => {
    const body = DryRun.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw badRequest('invalid body');
    const tenantId = c.req.param('tid');
    const id = c.req.param('id');
    const db = getDb();
    const rows = await db
      .select({
        endpointId: schema.tenantAiEndpoints.id,
        apiKeyCiphertext: schema.tenantAiEndpoints.apiKeyCiphertext,
        apiKeyDekId: schema.tenantAiEndpoints.apiKeyDekId,
        baseUrl: schema.tenantAiEndpoints.baseUrl,
        modelProvider: schema.aiModels.provider,
        modelId: schema.aiModels.modelId,
      })
      .from(schema.tenantAiEndpoints)
      .innerJoin(schema.aiModels, eq(schema.aiModels.id, schema.tenantAiEndpoints.modelId))
      .where(
        and(
          eq(schema.tenantAiEndpoints.id, id),
          eq(schema.tenantAiEndpoints.tenantId, tenantId),
          isNull(schema.tenantAiEndpoints.deletedAt),
        ),
      )
      .limit(1);
    const row = rows[0];
    if (!row) throw notFound('endpoint not found');

    const dekRows = await db
      .select()
      .from(schema.tenantDeks)
      .where(eq(schema.tenantDeks.id, row.apiKeyDekId))
      .limit(1);
    if (!dekRows[0]) throw notFound('dek missing');
    const dek = unwrapDek(dekRows[0].wrappedDek as Buffer);
    const apiKey = decryptWithDek(dek, row.apiKeyCiphertext as Buffer);

    const provider =
      row.modelProvider === 'anthropic'
        ? anthropicProvider(apiKey, row.baseUrl ?? 'https://api.anthropic.com')
        : openAiProvider(apiKey, row.baseUrl ?? 'https://api.openai.com');

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 15_000);
    const started = Date.now();
    try {
      const res = await provider.complete({
        model: row.modelId,
        messages: [{ role: 'user', content: body.data.prompt }],
        maxTokens: 64,
        temperature: 0,
        signal: ac.signal,
      });
      return c.json({
        ok: true,
        provider: provider.name,
        model: res.model,
        latencyMs: res.latencyMs,
        sample: res.content.slice(0, 240),
        usage: res.usage,
      });
    } catch (err) {
      return c.json(
        {
          ok: false,
          provider: provider.name,
          latencyMs: Date.now() - started,
          error: (err as Error).message,
        },
        502,
      );
    } finally {
      clearTimeout(timer);
    }
  },
);
