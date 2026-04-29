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

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    userId: uuid('user_id').notNull(),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    data: jsonb('data').notNull().default({}),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.createdAt)],
);

export const emailMessages = pgTable(
  'email_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id'),
    userId: uuid('user_id'),
    template: text('template').notNull(),
    subject: text('subject'),
    toEmail: text('to_email').notNull(),
    fromEmail: text('from_email').notNull(),
    provider: text('provider').notNull(),
    providerMessageId: text('provider_message_id'),
    status: text('status').notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('email_messages_to_idx').on(t.toEmail, t.createdAt)],
);

export const emailSuppressions = pgTable(
  'email_suppressions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    reason: text('reason').notNull(),
    source: text('source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('email_suppressions_email_uniq').on(t.email)],
);

export const smsMessages = pgTable(
  'sms_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id'),
    userId: uuid('user_id'),
    template: text('template').notNull(),
    toNumber: text('to_number').notNull(),
    fromNumber: text('from_number').notNull(),
    body: text('body').notNull(),
    provider: text('provider').notNull(),
    providerMessageId: text('provider_message_id'),
    status: text('status').notNull().default('queued'),
    segments: integer('segments'),
    costCents: integer('cost_cents'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sms_messages_to_idx').on(t.toNumber, t.createdAt)],
);

export const platformAdmins = pgTable(
  'platform_admins',
  {
    userId: uuid('user_id').primaryKey(),
    role: text('role').notNull().default('admin'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
);

export const platformIncidents = pgTable(
  'platform_incidents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    severity: text('severity').notNull(),
    status: text('status').notNull().default('investigating'),
    affectsComponents: jsonb('affects_components').notNull().default([]),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    summary: text('summary'),
    createdBy: uuid('created_by').notNull(),
  },
  (t) => [index('platform_incidents_status_idx').on(t.status, t.startedAt)],
);

export const platformIncidentUpdates = pgTable(
  'platform_incident_updates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    incidentId: uuid('incident_id').notNull(),
    body: text('body').notNull(),
    status: text('status'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('platform_incident_updates_incident_idx').on(t.incidentId, t.createdAt)],
);

export const featureFlags = pgTable(
  'feature_flags',
  {
    key: text('key').primaryKey(),
    enabled: boolean('enabled').notNull().default(false),
    rolloutPercent: integer('rollout_percent').notNull().default(0),
    tenantOverrides: jsonb('tenant_overrides').notNull().default({}),
    description: text('description'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
);
