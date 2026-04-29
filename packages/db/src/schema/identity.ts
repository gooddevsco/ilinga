import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  integer,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    emailNormalized: text('email_normalized').notNull(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    timezone: text('timezone').notNull().default('UTC'),
    locale: text('locale').notNull().default('en-GB'),
    uiPreferences: jsonb('ui_preferences').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('users_email_normalized_uniq').on(t.emailNormalized),
    index('users_created_at_idx').on(t.createdAt),
  ],
);

export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    tokenHash: text('token_hash').notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    deviceFingerprint: text('device_fingerprint'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    absoluteExpiresAt: timestamp('absolute_expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('user_sessions_token_hash_uniq').on(t.tokenHash),
    index('user_sessions_user_id_idx').on(t.userId, t.expiresAt),
  ],
);

export const userMagicLinks = pgTable(
  'user_magic_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'),
    email: text('email').notNull(),
    tokenHash: text('token_hash').notNull(),
    purpose: text('purpose').notNull(),
    requestIp: text('request_ip'),
    metadata: jsonb('metadata').notNull().default({}),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('user_magic_links_token_hash_uniq').on(t.tokenHash),
    index('user_magic_links_email_idx').on(t.email, t.expiresAt),
  ],
);

export const userOauthIdentities = pgTable(
  'user_oauth_identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    provider: text('provider').notNull(),
    subject: text('subject').notNull(),
    rawProfile: jsonb('raw_profile').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('user_oauth_identities_provider_subject_uniq').on(t.provider, t.subject),
    index('user_oauth_identities_user_id_idx').on(t.userId),
  ],
);

export const cookieConsents = pgTable(
  'cookie_consents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'),
    anonId: text('anon_id'),
    policyVersionHash: text('policy_version_hash').notNull(),
    categories: jsonb('categories').notNull().default({}),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('cookie_consents_user_id_idx').on(t.userId, t.createdAt),
    index('cookie_consents_anon_id_idx').on(t.anonId, t.createdAt),
  ],
);

export const failedLoginCounters = pgTable(
  'failed_login_counters',
  {
    email: text('email').primaryKey(),
    failures: integer('failures').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
);

export const userTrustedDevices = pgTable(
  'user_trusted_devices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    fingerprintHash: text('fingerprint_hash').notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    label: text('label'),
    impossibleTravelFlagged: boolean('impossible_travel_flagged').notNull().default(false),
  },
  (t) => [
    uniqueIndex('user_trusted_devices_user_fp_uniq').on(t.userId, t.fingerprintHash),
  ],
);
