import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  bigserial,
} from 'drizzle-orm/pg-core';
import { bytea } from '../types.js';

/**
 * Tamper-evident hash-chained audit log (§36).
 * row_hash = sha256(prev_hash || canonical_json(this row sans row_hash))
 * Chain head verifiable via `pnpm audit:verify`.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    seq: bigserial('seq', { mode: 'bigint' }).primaryKey(),
    id: uuid('id').notNull().defaultRandom(),
    tenantId: uuid('tenant_id'),
    actorUserId: uuid('actor_user_id'),
    impersonatorUserId: uuid('impersonator_user_id'),
    action: text('action').notNull(),
    targetTable: text('target_table'),
    targetId: uuid('target_id'),
    payload: jsonb('payload').notNull().default({}),
    ip: text('ip'),
    userAgent: text('user_agent'),
    requestId: text('request_id'),
    prevHash: bytea('prev_hash'),
    rowHash: bytea('row_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_log_tenant_idx').on(t.tenantId, t.createdAt),
    index('audit_log_action_idx').on(t.action, t.createdAt),
    index('audit_log_target_idx').on(t.targetTable, t.targetId),
  ],
);
