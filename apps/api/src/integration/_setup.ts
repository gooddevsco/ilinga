/**
 * Integration test setup. Spins up Drizzle against a CockroachDB instance
 * pointed at IL_DB_URL and applies the schema migration. Each test file
 * gets a fresh empty database via TRUNCATE in beforeEach.
 *
 * The integration suite is opt-in: turbo's `test:integration` script runs
 * against a Cockroach service, while plain `pnpm test` skips this folder.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { closeDb, getPool } from '@ilinga/db';

const ALL_TABLES = [
  'audit_log',
  'comment_mentions',
  'comments',
  'cycle_presence',
  'stakeholder_responses',
  'stakeholders',
  'question_answers',
  'reducer_verdicts',
  'content_key_pins',
  'content_keys',
  'prompt_runs',
  'modules',
  'cycle_event_log',
  'answer_embeddings',
  'artifact_embeddings',
  'artifact_scans',
  'venture_artifacts',
  'competitors',
  'venture_cycles',
  'ventures',
  'report_renders',
  'report_schedules',
  'reports',
  'webhook_deliveries',
  'webhook_endpoints',
  'api_tokens',
  'invoices',
  'coupon_redemptions',
  'auto_topups',
  'credit_ledger',
  'credits',
  'subscriptions',
  'tenant_ai_endpoints',
  'tenant_deks',
  'impersonation_sessions',
  'tenant_ownership_transfers',
  'tenant_invites',
  'tenant_members',
  'tenants',
  'cookie_consents',
  'user_trusted_devices',
  'user_oauth_identities',
  'user_magic_links',
  'user_sessions',
  'users',
  'notifications',
  'email_messages',
  'sms_messages',
  'platform_incident_updates',
  'platform_incidents',
  'platform_admins',
  'maintenance_windows',
  'dsar_requests',
  'deletion_tombstones',
  'api_request_log',
  'plans',
  'credit_packs',
  'ai_models',
  'ai_model_aliases',
  'questions',
  'report_templates',
  'feature_flags',
  'email_suppressions',
];

const applyMigration = async (): Promise<void> => {
  const pool = getPool();
  const sql = readFileSync(
    resolve(__dirname, '../../../../packages/db/migrations/0001_initial_schema.sql'),
    'utf8',
  );
  for (const stmt of sql.split('\n--> statement-breakpoint\n')) {
    const trimmed = stmt.trim();
    if (!trimmed) continue;
    await pool.query(trimmed).catch((err: Error) => {
      // Tolerate "already exists" so reruns don't blow up.
      if (!/already exists/i.test(err.message)) throw err;
    });
  }
};

beforeAll(async () => {
  process.env.IL_KMS_KEK_HEX =
    process.env.IL_KMS_KEK_HEX ??
    '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
  process.env.NODE_ENV = 'test';
  await applyMigration();
});

beforeEach(async () => {
  const pool = getPool();
  for (const t of ALL_TABLES) {
    await pool.query(`TRUNCATE TABLE "${t}" CASCADE`).catch(() => undefined);
  }
});

afterAll(async () => {
  await closeDb();
});
