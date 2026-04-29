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

export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    displayName: text('display_name').notNull(),
    region: text('region').notNull().default('eu'),
    industry: text('industry'),
    countryCode: text('country_code'),
    brandLogoUrl: text('brand_logo_url'),
    brandAccentHex: text('brand_accent_hex'),
    customDomain: text('custom_domain'),
    customDomainVerifiedAt: timestamp('custom_domain_verified_at', { withTimezone: true }),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('tenants_slug_uniq').on(t.slug),
    uniqueIndex('tenants_custom_domain_uniq').on(t.customDomain),
  ],
);

export const tenantMembers = pgTable(
  'tenant_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    userId: uuid('user_id').notNull(),
    role: text('role').notNull(),
    suspendedAt: timestamp('suspended_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('tenant_members_tenant_user_uniq').on(t.tenantId, t.userId),
    index('tenant_members_user_id_idx').on(t.userId),
  ],
);

export const tenantInvites = pgTable(
  'tenant_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    invitedBy: uuid('invited_by').notNull(),
    email: text('email').notNull(),
    role: text('role').notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('tenant_invites_token_hash_uniq').on(t.tokenHash),
    index('tenant_invites_tenant_email_idx').on(t.tenantId, t.email),
  ],
);

export const tenantOwnershipTransfers = pgTable(
  'tenant_ownership_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    fromUserId: uuid('from_user_id').notNull(),
    toUserId: uuid('to_user_id').notNull(),
    initiatedAt: timestamp('initiated_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  },
  (t) => [index('tenant_ownership_transfers_tenant_idx').on(t.tenantId)],
);

export const impersonationSessions = pgTable(
  'impersonation_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminUserId: uuid('admin_user_id').notNull(),
    impersonatedUserId: uuid('impersonated_user_id').notNull(),
    tenantId: uuid('tenant_id').notNull(),
    reason: text('reason').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    ip: text('ip'),
    userAgent: text('user_agent'),
  },
  (t) => [
    index('impersonation_sessions_tenant_idx').on(t.tenantId, t.startedAt),
    index('impersonation_sessions_admin_idx').on(t.adminUserId, t.startedAt),
  ],
);

export const deletionTombstones = pgTable(
  'deletion_tombstones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id'),
    targetTable: text('target_table').notNull(),
    targetId: uuid('target_id').notNull(),
    deletedBy: uuid('deleted_by').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }).notNull().defaultNow(),
    restoreDeadline: timestamp('restore_deadline', { withTimezone: true }).notNull(),
    hardDeletedAt: timestamp('hard_deleted_at', { withTimezone: true }),
    payload: jsonb('payload').notNull().default({}),
  },
  (t) => [
    index('deletion_tombstones_deadline_idx').on(t.tenantId, t.targetTable, t.restoreDeadline),
    uniqueIndex('deletion_tombstones_target_uniq').on(t.targetTable, t.targetId),
  ],
);

export const apiRequestLog = pgTable(
  'api_request_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id'),
    actorUserId: uuid('actor_user_id'),
    apiTokenId: uuid('api_token_id'),
    method: text('method').notNull(),
    path: text('path').notNull(),
    status: integer('status').notNull(),
    latencyMs: integer('latency_ms').notNull(),
    requestId: text('request_id'),
    ip: text('ip'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('api_request_log_tenant_idx').on(t.tenantId, t.createdAt)],
);

export const dsarRequests = pgTable(
  'dsar_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    tenantId: uuid('tenant_id'),
    kind: text('kind').notNull(),
    description: text('description'),
    status: text('status').notNull().default('open'),
    assignedAdminId: uuid('assigned_admin_id'),
    resolution: text('resolution'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [index('dsar_requests_status_idx').on(t.status, t.createdAt)],
);

export const maintenanceWindows = pgTable(
  'maintenance_windows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    message: text('message').notNull(),
    severity: text('severity').notNull().default('info'),
    affectsComponents: jsonb('affects_components').notNull().default([]),
    published: boolean('published').notNull().default(false),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('maintenance_windows_window_idx').on(t.startsAt, t.endsAt)],
);
