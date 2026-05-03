import { and, eq, gt, sql } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { generateToken, sha256Hex } from '../crypto.js';
import { config } from '../../config.js';

export const inviteStakeholder = async (input: {
  tenantId: string;
  cycleId: string;
  email: string;
  label?: string | null;
  invitedBy: string;
}): Promise<{ id: string; rawToken: string; expiresAt: Date }> => {
  const db = getDb();
  const rawToken = generateToken(32);
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 86_400_000);
  const [row] = await db
    .insert(schema.stakeholders)
    .values({
      tenantId: input.tenantId,
      cycleId: input.cycleId,
      email: input.email,
      label: input.label ?? null,
      tokenHash,
      invitedBy: input.invitedBy,
      expiresAt,
    })
    .returning({ id: schema.stakeholders.id });
  if (!row) throw new Error('insert failed');
  return { id: row.id, rawToken, expiresAt };
};

export const stakeholderUrl = (rawToken: string): string => {
  const cfg = config();
  return `${cfg.IL_WEB_ORIGIN}/s/${rawToken}`;
};

export const resolveStakeholderToken = async (rawToken: string) => {
  const db = getDb();
  const tokenHash = sha256Hex(rawToken);
  const rows = await db
    .select()
    .from(schema.stakeholders)
    .where(
      and(
        eq(schema.stakeholders.tokenHash, tokenHash),
        gt(schema.stakeholders.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
};

export const submitStakeholderResponse = async (input: {
  stakeholderId: string;
  questionId?: string | null;
  rawValue?: unknown;
  freeText?: string | null;
  uploadedArtifactId?: string | null;
}): Promise<void> => {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.insert(schema.stakeholderResponses).values({
      stakeholderId: input.stakeholderId,
      questionId: input.questionId ?? null,
      rawValue: (input.rawValue ?? null) as never,
      freeText: input.freeText ?? null,
      uploadedArtifactId: input.uploadedArtifactId ?? null,
    });
    if (input.freeText && input.freeText.trim().length > 0) {
      // Fold the stakeholder's free-text into a content key so subsequent
      // synthesis runs can include it. The reducer will weigh these
      // against module outputs by confidence.
      const [stakeholder] = await tx
        .select({
          tenantId: schema.stakeholders.tenantId,
          cycleId: schema.stakeholders.cycleId,
        })
        .from(schema.stakeholders)
        .where(eq(schema.stakeholders.id, input.stakeholderId))
        .limit(1);
      if (stakeholder) {
        const code = `stakeholder.${input.stakeholderId.slice(0, 8)}.feedback`;
        const [{ next }] = (await tx.execute<{ next: number }>(
          sql`select coalesce(max(version), 0) + 1 as next from content_keys where tenant_id = ${stakeholder.tenantId} and cycle_id = ${stakeholder.cycleId} and code = ${code}`,
        )) as unknown as [{ next: number }];
        await tx.insert(schema.contentKeys).values({
          tenantId: stakeholder.tenantId,
          cycleId: stakeholder.cycleId,
          code,
          version: next,
          value: { text: input.freeText.trim() } as never,
          confidence: 60,
          source: 'stakeholder',
        });
      }
    }
  });
};

export const optOutStakeholder = async (rawToken: string): Promise<void> => {
  const tokenHash = sha256Hex(rawToken);
  await getDb()
    .update(schema.stakeholders)
    .set({ optedOutAt: new Date() })
    .where(eq(schema.stakeholders.tokenHash, tokenHash));
};
