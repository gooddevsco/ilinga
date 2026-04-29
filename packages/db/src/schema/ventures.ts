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

export const ventures = pgTable(
  'ventures',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    name: text('name').notNull(),
    industry: text('industry'),
    geos: jsonb('geos').notNull().default([]),
    brief: jsonb('brief').notNull().default({}),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('ventures_tenant_idx').on(t.tenantId, t.createdAt)],
);

export const ventureCycles = pgTable(
  'venture_cycles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    ventureId: uuid('venture_id').notNull(),
    seq: integer('seq').notNull(),
    status: text('status').notNull().default('open'),
    frozenAt: timestamp('frozen_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('venture_cycles_tenant_idx').on(t.tenantId, t.createdAt),
    uniqueIndex('venture_cycles_venture_seq_uniq').on(t.ventureId, t.seq),
  ],
);

export const ventureArtifacts = pgTable(
  'venture_artifacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id').notNull(),
    kind: text('kind').notNull(),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type'),
    sizeBytes: integer('size_bytes'),
    s3Key: text('s3_key').notNull(),
    extractionStatus: text('extraction_status').notNull().default('pending'),
    extractionText: text('extraction_text'),
    uploadedBy: uuid('uploaded_by').notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('venture_artifacts_cycle_idx').on(t.cycleId, t.uploadedAt)],
);

export const artifactScans = pgTable(
  'artifact_scans',
  {
    artifactId: uuid('artifact_id').primaryKey(),
    status: text('status').notNull().default('queued'),
    scannedAt: timestamp('scanned_at', { withTimezone: true }),
    signatureDbVersion: text('signature_db_version'),
    threatName: text('threat_name'),
  },
);

export const competitors = pgTable(
  'competitors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id').notNull(),
    url: text('url').notNull(),
    label: text('label'),
    scrapeStatus: text('scrape_status').notNull().default('queued'),
    scrapedAt: timestamp('scraped_at', { withTimezone: true }),
    extractionText: text('extraction_text'),
    structured: jsonb('structured').notNull().default({}),
    addedBy: uuid('added_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('competitors_cycle_idx').on(t.cycleId)],
);

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    cluster: text('cluster').notNull(),
    label: text('label').notNull(),
    helpText: text('help_text'),
    inputType: text('input_type').notNull().default('text'),
    options: jsonb('options'),
    sequence: integer('sequence').notNull(),
    isCore: boolean('is_core').notNull().default(true),
  },
  (t) => [uniqueIndex('questions_code_uniq').on(t.code)],
);

export const questionAnswers = pgTable(
  'question_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id').notNull(),
    questionId: uuid('question_id').notNull(),
    answeredBy: uuid('answered_by').notNull(),
    rawValue: jsonb('raw_value'),
    notes: text('notes'),
    skipped: boolean('skipped').notNull().default(false),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('question_answers_cycle_question_uniq').on(t.cycleId, t.questionId),
    index('question_answers_tenant_idx').on(t.tenantId),
  ],
);

export const stakeholders = pgTable(
  'stakeholders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id').notNull(),
    email: text('email').notNull(),
    label: text('label'),
    tokenHash: text('token_hash').notNull(),
    invitedBy: uuid('invited_by').notNull(),
    invitedAt: timestamp('invited_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    optedOutAt: timestamp('opted_out_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex('stakeholders_token_hash_uniq').on(t.tokenHash),
    index('stakeholders_cycle_idx').on(t.cycleId),
  ],
);

export const stakeholderResponses = pgTable(
  'stakeholder_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stakeholderId: uuid('stakeholder_id').notNull(),
    questionId: uuid('question_id'),
    rawValue: jsonb('raw_value'),
    freeText: text('free_text'),
    uploadedArtifactId: uuid('uploaded_artifact_id'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('stakeholder_responses_stakeholder_idx').on(t.stakeholderId)],
);

export const cyclePresence = pgTable(
  'cycle_presence',
  {
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id').notNull(),
    userId: uuid('user_id').notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    location: text('location'),
  },
  (t) => [
    uniqueIndex('cycle_presence_uniq').on(t.tenantId, t.cycleId, t.userId),
    index('cycle_presence_cycle_idx').on(t.cycleId, t.lastSeenAt),
  ],
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    cycleId: uuid('cycle_id'),
    targetTable: text('target_table').notNull(),
    targetId: uuid('target_id').notNull(),
    authorId: uuid('author_id').notNull(),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('comments_target_idx').on(t.tenantId, t.targetTable, t.targetId, t.createdAt)],
);

export const commentMentions = pgTable(
  'comment_mentions',
  {
    commentId: uuid('comment_id').notNull(),
    mentionedUserId: uuid('mentioned_user_id').notNull(),
    notifiedAt: timestamp('notified_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('comment_mentions_uniq').on(t.commentId, t.mentionedUserId),
  ],
);
