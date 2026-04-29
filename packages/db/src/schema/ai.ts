import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { bytea } from '../types.js';

export const aiModels = pgTable(
  'ai_models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id'),
    provider: text('provider').notNull(),
    family: text('family').notNull(),
    modelId: text('model_id').notNull(),
    displayName: text('display_name').notNull(),
    capabilities: jsonb('capabilities').notNull().default([]),
    contextWindow: integer('context_window'),
    maxOutputTokens: integer('max_output_tokens'),
    costPerMillionInputCents: integer('cost_per_million_input_cents'),
    costPerMillionOutputCents: integer('cost_per_million_output_cents'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('ai_models_provider_model_uniq').on(t.tenantId, t.provider, t.modelId),
    index('ai_models_provider_idx').on(t.provider),
  ],
);

export const aiModelAliases = pgTable(
  'ai_model_aliases',
  {
    alias: text('alias').notNull(),
    tenantId: uuid('tenant_id'),
    modelId: uuid('model_id').notNull(),
  },
  (t) => [uniqueIndex('ai_model_aliases_uniq').on(t.alias, t.tenantId)],
);

export const tenantAiEndpoints = pgTable(
  'tenant_ai_endpoints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    modelId: uuid('model_id').notNull(),
    label: text('label').notNull(),
    baseUrl: text('base_url'),
    apiKeyCiphertext: bytea('api_key_ciphertext').notNull(),
    apiKeyDekId: uuid('api_key_dek_id').notNull(),
    apiKeyLastFour: text('api_key_last_four'),
    workloads: jsonb('workloads').notNull().default([]),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('tenant_ai_endpoints_tenant_idx').on(t.tenantId, t.createdAt),
    index('tenant_ai_endpoints_workload_idx').on(t.tenantId, t.workloads),
  ],
);

export const tenantDeks = pgTable(
  'tenant_deks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    wrappedDek: bytea('wrapped_dek').notNull(),
    kekVersion: integer('kek_version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    rotatedAt: timestamp('rotated_at', { withTimezone: true }),
  },
  (t) => [index('tenant_deks_tenant_idx').on(t.tenantId, t.createdAt)],
);
