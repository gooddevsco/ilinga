import { eq, and, gt, isNull } from 'drizzle-orm';
import { schema } from '@ilinga/db';
import { getDb } from '@ilinga/db';
import { generateToken, sha256Hex, normaliseEmail } from '../crypto.js';
import { config } from '../../config.js';

export type MagicLinkPurpose =
  | 'signup'
  | 'signin'
  | 'tenant_invite'
  | 'email_change_verify'
  | 'account_recovery'
  | 'step_up';

export interface IssueMagicLinkInput {
  email: string;
  purpose: MagicLinkPurpose;
  userId?: string | null;
  metadata?: Record<string, unknown>;
  requestIp?: string;
}

export interface IssuedMagicLink {
  rawToken: string;
  expiresAt: Date;
  url: string;
}

/**
 * Generate a magic-link row + return the raw token and a callback URL for
 * email delivery. Always succeeds even if the user does not exist (caller
 * decides whether to actually send the email — anti-enumeration).
 */
export const issueMagicLink = async (input: IssueMagicLinkInput): Promise<IssuedMagicLink> => {
  const cfg = config();
  const db = getDb();
  const rawToken = generateToken(32);
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + cfg.IL_MAGIC_LINK_TTL_MIN * 60_000);

  await db.insert(schema.userMagicLinks).values({
    userId: input.userId ?? null,
    email: normaliseEmail(input.email),
    tokenHash,
    purpose: input.purpose,
    requestIp: input.requestIp ?? null,
    metadata: input.metadata ?? {},
    expiresAt,
  });

  const url = `${cfg.IL_WEB_ORIGIN}/auth/callback/magic?token=${rawToken}&purpose=${input.purpose}`;
  return { rawToken, expiresAt, url };
};

export interface ConsumeMagicLinkResult {
  ok: boolean;
  reason?: 'not_found' | 'expired' | 'already_consumed';
  email?: string;
  userId?: string | null;
  purpose?: MagicLinkPurpose;
  metadata?: Record<string, unknown>;
}

/**
 * Atomically validate + consume a magic link. Returns the row data so callers
 * (signup vs signin vs invite vs email change) can act accordingly.
 */
export const consumeMagicLink = async (rawToken: string): Promise<ConsumeMagicLinkResult> => {
  const db = getDb();
  const tokenHash = sha256Hex(rawToken);
  const now = new Date();

  const rows = await db
    .select()
    .from(schema.userMagicLinks)
    .where(
      and(
        eq(schema.userMagicLinks.tokenHash, tokenHash),
        gt(schema.userMagicLinks.expiresAt, now),
        isNull(schema.userMagicLinks.consumedAt),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, reason: 'not_found' };

  const updated = await db
    .update(schema.userMagicLinks)
    .set({ consumedAt: now })
    .where(
      and(
        eq(schema.userMagicLinks.id, row.id),
        isNull(schema.userMagicLinks.consumedAt),
      ),
    )
    .returning({ id: schema.userMagicLinks.id });

  if (updated.length === 0) return { ok: false, reason: 'already_consumed' };

  return {
    ok: true,
    email: row.email,
    userId: row.userId,
    purpose: row.purpose as MagicLinkPurpose,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
};
