import { and, eq, isNull } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { generateToken, sha256Hex } from '../crypto.js';

export const PAT_PREFIX = 'il_pat_';

export interface IssuedToken {
  id: string;
  raw: string;
  prefix: string;
}

export const issuePat = async (input: {
  tenantId: string;
  userId: string | null;
  label: string;
  scopes: string[];
  expiresAt?: Date | null;
}): Promise<IssuedToken> => {
  const random = generateToken(28);
  const raw = `${PAT_PREFIX}${random}`;
  const prefix = raw.slice(0, 12);
  const tokenHash = sha256Hex(raw);
  const [row] = await getDb()
    .insert(schema.apiTokens)
    .values({
      tenantId: input.tenantId,
      userId: input.userId,
      label: input.label,
      tokenHash,
      tokenPrefix: prefix,
      scopes: input.scopes,
      expiresAt: input.expiresAt ?? null,
    })
    .returning({ id: schema.apiTokens.id });
  return { id: row!.id, raw, prefix };
};

export const resolvePat = async (raw: string) => {
  if (!raw.startsWith(PAT_PREFIX)) return null;
  const tokenHash = sha256Hex(raw);
  const rows = await getDb()
    .select()
    .from(schema.apiTokens)
    .where(
      and(eq(schema.apiTokens.tokenHash, tokenHash), isNull(schema.apiTokens.revokedAt)),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt && row.expiresAt < new Date()) return null;
  return row;
};

export const revokePat = async (id: string): Promise<void> => {
  await getDb()
    .update(schema.apiTokens)
    .set({ revokedAt: new Date() })
    .where(eq(schema.apiTokens.id, id));
};
