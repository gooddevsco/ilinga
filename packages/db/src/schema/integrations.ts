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

export const webhookEndpoints = pgTable(
  'webhook_endpoints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    url: text('url').notNull(),
    secretCiphertext: bytea('secret_ciphertext').notNull(),
    secretDekId: uuid('secret_dek_id').notNull(),
    previousSecretCiphertext: bytea('previous_secret_ciphertext'),
    previousSecretValidUntil: timestamp('previous_secret_valid_until', { withTimezone: true }),
    events: jsonb('events').notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('webhook_endpoints_tenant_idx').on(t.tenantId)],
);

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    endpointId: uuid('endpoint_id').notNull(),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull(),
    requestSignature: text('request_signature'),
    status: text('status').notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    lastResponseStatus: integer('last_response_status'),
    lastResponseBody: text('last_response_body'),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('webhook_deliveries_endpoint_idx').on(t.endpointId, t.createdAt),
    index('webhook_deliveries_status_idx').on(t.status, t.nextAttemptAt),
  ],
);

export const apiTokens = pgTable(
  'api_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    userId: uuid('user_id'),
    label: text('label').notNull(),
    tokenHash: text('token_hash').notNull(),
    tokenPrefix: text('token_prefix').notNull(),
    scopes: jsonb('scopes').notNull().default([]),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('api_tokens_token_hash_uniq').on(t.tokenHash),
    index('api_tokens_tenant_idx').on(t.tenantId),
  ],
);

export const n8nWorkflows = pgTable(
  'n8n_workflows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id'),
    n8nId: text('n8n_id').notNull(),
    label: text('label').notNull(),
    purpose: text('purpose').notNull(),
    activeRevision: integer('active_revision').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('n8n_workflows_n8n_id_uniq').on(t.n8nId)],
);

export const n8nWorkflowRevisions = pgTable(
  'n8n_workflow_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workflowId: uuid('workflow_id').notNull(),
    revision: integer('revision').notNull(),
    json: jsonb('json').notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('n8n_workflow_revisions_uniq').on(t.workflowId, t.revision)],
);
