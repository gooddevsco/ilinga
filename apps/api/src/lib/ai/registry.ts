import { and, eq, isNull } from 'drizzle-orm';
import { schema, getDb, decryptWithDek, unwrapDek } from '@ilinga/db';
import { openAiProvider } from './openai.js';
import { anthropicProvider } from './anthropic.js';
import type { AiProvider } from './types.js';

export interface ProviderResolver {
  pick(workload: string): { provider: AiProvider; model: string } | null;
}

export const buildSystemRegistry = (): ProviderResolver => {
  const openaiKey = process.env.IL_SYSTEM_OPENAI_KEY ?? '';
  return {
    pick(workload) {
      if (workload === 'embeddings') {
        return openaiKey
          ? { provider: openAiProvider(openaiKey), model: 'text-embedding-3-large' }
          : null;
      }
      if (openaiKey) {
        return {
          provider: openAiProvider(openaiKey),
          model: process.env.IL_SYSTEM_OPENAI_MODEL ?? 'gpt-4o-mini',
        };
      }
      return null;
    },
  };
};

/**
 * Look up a tenant_ai_endpoints row that explicitly lists this workload, in
 * the right priority order. Decrypts the API key with the tenant DEK and
 * returns a ready-to-stream AiProvider.
 */
export const resolveTenantWorkload = async (
  tenantId: string,
  workload: string,
): Promise<{ provider: AiProvider; model: string } | null> => {
  const db = getDb();
  const rows = await db
    .select({
      endpointId: schema.tenantAiEndpoints.id,
      apiKeyCiphertext: schema.tenantAiEndpoints.apiKeyCiphertext,
      apiKeyDekId: schema.tenantAiEndpoints.apiKeyDekId,
      baseUrl: schema.tenantAiEndpoints.baseUrl,
      modelProvider: schema.aiModels.provider,
      modelId: schema.aiModels.modelId,
      workloads: schema.tenantAiEndpoints.workloads,
      isDefault: schema.tenantAiEndpoints.isDefault,
    })
    .from(schema.tenantAiEndpoints)
    .innerJoin(schema.aiModels, eq(schema.aiModels.id, schema.tenantAiEndpoints.modelId))
    .where(
      and(
        eq(schema.tenantAiEndpoints.tenantId, tenantId),
        isNull(schema.tenantAiEndpoints.deletedAt),
      ),
    );
  const match = rows
    .filter((r) => Array.isArray(r.workloads) && (r.workloads as string[]).includes(workload))
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))[0];
  if (!match) return null;

  const dekRows = await db
    .select()
    .from(schema.tenantDeks)
    .where(eq(schema.tenantDeks.id, match.apiKeyDekId))
    .limit(1);
  if (!dekRows[0]) return null;
  const dek = unwrapDek(dekRows[0].wrappedDek as Buffer);
  const apiKey = decryptWithDek(dek, match.apiKeyCiphertext as Buffer);

  if (match.modelProvider === 'openai') {
    return {
      provider: openAiProvider(apiKey, match.baseUrl ?? 'https://api.openai.com'),
      model: match.modelId,
    };
  }
  if (match.modelProvider === 'anthropic') {
    return {
      provider: anthropicProvider(apiKey, match.baseUrl ?? 'https://api.anthropic.com'),
      model: match.modelId,
    };
  }
  return null;
};

/** Tenant endpoint takes precedence; fall back to the system fallback. */
export const resolveWorkload = async (
  tenantId: string,
  workload: string,
): Promise<{ provider: AiProvider; model: string } | null> => {
  const tenant = await resolveTenantWorkload(tenantId, workload);
  if (tenant) return tenant;
  return buildSystemRegistry().pick(workload);
};

export const inMemoryProvider = (sequence: string[]): AiProvider => ({
  name: 'in-memory',
  async complete() {
    return {
      content: sequence.join(''),
      usage: { inputTokens: 1, outputTokens: sequence.length },
      model: 'mock',
      provider: 'in-memory',
      latencyMs: 0,
    };
  },
  async *stream() {
    for (const part of sequence) {
      yield { delta: part };
    }
  },
});
