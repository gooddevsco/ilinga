import { and, eq, gt, isNull } from 'drizzle-orm';
import { schema } from '@ilinga/db';
import { getDb } from '@ilinga/db';
import { generateToken, sha256Hex } from '../crypto.js';
import { config } from '../../config.js';

export interface CreateSessionInput {
  userId: string;
  ip?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface IssuedSession {
  rawToken: string;
  csrfToken: string;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  sessionId: string;
}

export const createSession = async (input: CreateSessionInput): Promise<IssuedSession> => {
  const db = getDb();
  const cfg = config();
  const rawToken = generateToken(32);
  const csrfToken = generateToken(24);
  const tokenHash = sha256Hex(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + cfg.IL_SESSION_TTL_HOURS * 3_600_000);
  const absoluteExpiresAt = new Date(now.getTime() + 30 * 86_400_000);

  const [row] = await db
    .insert(schema.userSessions)
    .values({
      userId: input.userId,
      tokenHash,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      deviceFingerprint: input.deviceFingerprint ?? null,
      expiresAt,
      absoluteExpiresAt,
    })
    .returning({ id: schema.userSessions.id });

  return { rawToken, csrfToken, expiresAt, absoluteExpiresAt, sessionId: row!.id };
};

export interface ResolvedSession {
  sessionId: string;
  userId: string;
  expiresAt: Date;
  absoluteExpiresAt: Date;
}

export const resolveSession = async (rawToken: string): Promise<ResolvedSession | null> => {
  const db = getDb();
  const tokenHash = sha256Hex(rawToken);
  const now = new Date();

  const rows = await db
    .select({
      id: schema.userSessions.id,
      userId: schema.userSessions.userId,
      expiresAt: schema.userSessions.expiresAt,
      absoluteExpiresAt: schema.userSessions.absoluteExpiresAt,
    })
    .from(schema.userSessions)
    .where(
      and(
        eq(schema.userSessions.tokenHash, tokenHash),
        gt(schema.userSessions.expiresAt, now),
        gt(schema.userSessions.absoluteExpiresAt, now),
        isNull(schema.userSessions.revokedAt),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    sessionId: row.id,
    userId: row.userId,
    expiresAt: row.expiresAt,
    absoluteExpiresAt: row.absoluteExpiresAt,
  };
};

export const slideSession = async (sessionId: string): Promise<Date> => {
  const db = getDb();
  const cfg = config();
  const newExpiresAt = new Date(Date.now() + cfg.IL_SESSION_TTL_HOURS * 3_600_000);
  await db
    .update(schema.userSessions)
    .set({ expiresAt: newExpiresAt, lastSeenAt: new Date() })
    .where(eq(schema.userSessions.id, sessionId));
  return newExpiresAt;
};

export const revokeSession = async (sessionId: string): Promise<void> => {
  const db = getDb();
  await db
    .update(schema.userSessions)
    .set({ revokedAt: new Date() })
    .where(eq(schema.userSessions.id, sessionId));
};

export const revokeAllForUser = async (userId: string): Promise<void> => {
  const db = getDb();
  await db
    .update(schema.userSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.userSessions.userId, userId), isNull(schema.userSessions.revokedAt)));
};
