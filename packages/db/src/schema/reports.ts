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

export const reportTemplates = pgTable(
  'report_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id'),
    code: text('code').notNull(),
    version: integer('version').notNull().default(1),
    displayName: text('display_name').notNull(),
    description: text('description'),
    handlebarsHtml: text('handlebars_html').notNull(),
    handlebarsMjml: text('handlebars_mjml'),
    requiredKeys: jsonb('required_keys').notNull().default([]),
    creditCost: integer('credit_cost').notNull().default(0),
    pricingTier: text('pricing_tier').notNull().default('free'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deprecatedAt: timestamp('deprecated_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('report_templates_code_version_uniq').on(t.code, t.version)],
);

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id').notNull(),
    templateId: uuid('template_id').notNull(),
    title: text('title').notNull(),
    inputKeySnapshot: jsonb('input_key_snapshot').notNull(),
    keysHash: text('keys_hash').notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('reports_cycle_idx').on(t.cycleId, t.createdAt),
    index('reports_keys_hash_idx').on(t.tenantId, t.templateId, t.keysHash),
  ],
);

export const reportRenders = pgTable(
  'report_renders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    reportId: uuid('report_id').notNull(),
    status: text('status').notNull().default('queued'),
    htmlS3Key: text('html_s3_key'),
    pdfS3Key: text('pdf_s3_key'),
    creditsCharged: integer('credits_charged').notNull().default(0),
    forced: boolean('forced').notNull().default(false),
    pageCount: integer('page_count'),
    queuedAt: timestamp('queued_at', { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    failureReason: text('failure_reason'),
  },
  (t) => [
    index('report_renders_report_idx').on(t.reportId, t.queuedAt),
    index('report_renders_status_idx').on(t.status, t.queuedAt),
  ],
);

export const reportSchedules = pgTable(
  'report_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    reportId: uuid('report_id').notNull(),
    cron: text('cron').notNull(),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }).notNull(),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    pausedAt: timestamp('paused_at', { withTimezone: true }),
  },
  (t) => [index('report_schedules_next_run_idx').on(t.nextRunAt)],
);
