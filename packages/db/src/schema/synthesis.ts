import { sql } from 'drizzle-orm';
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
  customType,
} from 'drizzle-orm/pg-core';

const vector = (name: string, dimensions: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${dimensions})`;
    },
    toDriver(value) {
      return `[${value.join(',')}]`;
    },
    fromDriver(value) {
      return JSON.parse(value as string);
    },
  })(name);

export const modules = pgTable(
  'modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id').notNull(),
    code: text('code').notNull(),
    cluster: text('cluster').notNull(),
    label: text('label').notNull(),
    status: text('status').notNull().default('queued'),
    aiWorkload: text('ai_workload').notNull(),
    promptTemplate: text('prompt_template').notNull(),
    inputContext: jsonb('input_context').notNull().default({}),
    outputKeys: jsonb('output_keys').notNull().default([]),
    creditCost: integer('credit_cost').notNull().default(1),
    queuedAt: timestamp('queued_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    failureReason: text('failure_reason'),
  },
  (t) => [
    index('modules_cycle_status_idx').on(t.cycleId, t.status),
    uniqueIndex('modules_cycle_code_uniq').on(t.cycleId, t.code),
  ],
);

export const promptRuns = pgTable(
  'prompt_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id').notNull(),
    moduleId: uuid('module_id'),
    aiEndpointId: uuid('ai_endpoint_id'),
    aiModelId: uuid('ai_model_id'),
    workload: text('workload').notNull(),
    promptHash: text('prompt_hash').notNull(),
    promptText: text('prompt_text'),
    completionText: text('completion_text'),
    status: text('status').notNull().default('queued'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    latencyMs: integer('latency_ms'),
    errorMessage: text('error_message'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    creditsCharged: integer('credits_charged').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    index('prompt_runs_module_idx').on(t.moduleId, t.createdAt),
    index('prompt_runs_cycle_idx').on(t.cycleId, t.createdAt),
  ],
);

export const contentKeys = pgTable(
  'content_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id').notNull(),
    code: text('code').notNull(),
    version: integer('version').notNull().default(1),
    value: jsonb('value').notNull(),
    confidence: integer('confidence'),
    source: text('source').notNull(),
    sourceModuleId: uuid('source_module_id'),
    sourcePromptRunId: uuid('source_prompt_run_id'),
    supersededBy: uuid('superseded_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('content_keys_cycle_code_version_uniq').on(t.cycleId, t.code, t.version),
    index('content_keys_cycle_idx').on(t.cycleId, t.code),
  ],
);

export const contentKeyPins = pgTable(
  'content_key_pins',
  {
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id').notNull(),
    code: text('code').notNull(),
    pinnedBy: uuid('pinned_by').notNull(),
    pinnedAt: timestamp('pinned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('content_key_pins_uniq').on(t.tenantId, t.cycleId, t.code)],
);

export const reducerVerdicts = pgTable(
  'reducer_verdicts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id').notNull(),
    code: text('code').notNull(),
    candidates: jsonb('candidates').notNull(),
    chosen: jsonb('chosen').notNull(),
    rationale: text('rationale'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('reducer_verdicts_cycle_idx').on(t.cycleId, t.code)],
);

export const artifactEmbeddings = pgTable(
  'artifact_embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id').notNull(),
    artifactId: uuid('artifact_id').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    chunkText: text('chunk_text').notNull(),
    embedding: vector('embedding', 1024).notNull(),
    aiModelId: uuid('ai_model_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('artifact_embeddings_cycle_idx').on(t.cycleId),
    uniqueIndex('artifact_embeddings_artifact_chunk_uniq').on(t.artifactId, t.chunkIndex),
  ],
);

export const answerEmbeddings = pgTable(
  'answer_embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id').notNull(),
    answerId: uuid('answer_id').notNull(),
    embedding: vector('embedding', 1024).notNull(),
    aiModelId: uuid('ai_model_id'),
  },
  (t) => [
    uniqueIndex('answer_embeddings_answer_uniq').on(t.answerId),
    index('answer_embeddings_cycle_idx').on(t.cycleId),
  ],
);

export const cycleEventLog = pgTable(
  'cycle_event_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id').notNull(),
    kind: text('kind').notNull(),
    payload: jsonb('payload').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    happensAfter: text('happens_after'),
    cancelled: boolean('cancelled').notNull().default(false),
  },
  (t) => [index('cycle_event_log_cycle_idx').on(t.cycleId, t.createdAt)],
);
