import { eq } from 'drizzle-orm';
import { schema } from '@ilinga/db';
import { getDb } from '@ilinga/db';
import { normaliseEmail } from '../crypto.js';

export interface UpsertUserInput {
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export const findUserByEmail = async (email: string) => {
  const db = getDb();
  const norm = normaliseEmail(email);
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.emailNormalized, norm))
    .limit(1);
  return rows[0] ?? null;
};

export const upsertUser = async (input: UpsertUserInput) => {
  const db = getDb();
  const norm = normaliseEmail(input.email);
  const existing = await findUserByEmail(norm);
  if (existing) {
    if (input.displayName && existing.displayName !== input.displayName) {
      await db
        .update(schema.users)
        .set({ displayName: input.displayName, updatedAt: new Date() })
        .where(eq(schema.users.id, existing.id));
    }
    return existing;
  }
  const [created] = await db
    .insert(schema.users)
    .values({
      email: input.email,
      emailNormalized: norm,
      displayName: input.displayName ?? null,
      avatarUrl: input.avatarUrl ?? null,
    })
    .returning();
  return created!;
};

export const setUserEmail = async (userId: string, newEmail: string): Promise<void> => {
  const db = getDb();
  await db
    .update(schema.users)
    .set({ email: newEmail, emailNormalized: normaliseEmail(newEmail), updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
};

export const softDeleteUser = async (userId: string): Promise<void> => {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.users.id, userId));
    await tx
      .update(schema.userSessions)
      .set({ revokedAt: new Date() })
      .where(eq(schema.userSessions.userId, userId));
    await tx.insert(schema.deletionTombstones).values({
      tenantId: null,
      targetTable: 'users',
      targetId: userId,
      deletedBy: userId,
      restoreDeadline: new Date(Date.now() + 7 * 86_400_000),
      payload: {},
    });
  });
};
