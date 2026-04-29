/* eslint-disable no-console */
import { closeDb, getPool } from '../client.js';

const TABLES = [
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
];

export const reset = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('reset is not allowed in production');
  }
  const pool = getPool();
  for (const t of TABLES) {
    await pool.query(`TRUNCATE TABLE "${t}" CASCADE`).catch(() => undefined);
  }
  console.log('Database reset complete.');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  reset()
    .then(() => closeDb())
    .catch(async (err) => {
      console.error(err);
      await closeDb();
      process.exit(1);
    });
}
