import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';

export const createVenture = async (
  tenantId: string,
  userId: string,
  input: {
    name: string;
    industry?: string | null;
    geos?: string[];
    brief?: Record<string, unknown>;
  },
) => {
  const db = getDb();
  const [venture] = await db
    .insert(schema.ventures)
    .values({
      tenantId,
      name: input.name,
      industry: input.industry ?? null,
      geos: input.geos ?? [],
      brief: input.brief ?? {},
      createdBy: userId,
    })
    .returning();
  if (!venture) throw new Error('insert failed');
  // start cycle 1
  const [cycle] = await db
    .insert(schema.ventureCycles)
    .values({ tenantId, ventureId: venture.id, seq: 1, status: 'open', createdBy: userId })
    .returning();
  return { venture, cycle: cycle! };
};

export const listVentures = (tenantId: string) => {
  const db = getDb();
  return db
    .select()
    .from(schema.ventures)
    .where(and(eq(schema.ventures.tenantId, tenantId), isNull(schema.ventures.deletedAt)))
    .orderBy(desc(schema.ventures.createdAt));
};

export const getVenture = async (tenantId: string, ventureId: string) => {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.ventures)
    .where(and(eq(schema.ventures.id, ventureId), eq(schema.ventures.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
};

export const updateBrief = async (
  tenantId: string,
  ventureId: string,
  brief: Record<string, unknown>,
): Promise<void> => {
  await getDb()
    .update(schema.ventures)
    .set({ brief, updatedAt: new Date() })
    .where(and(eq(schema.ventures.id, ventureId), eq(schema.ventures.tenantId, tenantId)));
};

export const cloneCycle = async (
  tenantId: string,
  userId: string,
  cycleId: string,
): Promise<{ id: string; seq: number }> => {
  const db = getDb();
  const [src] = await db
    .select()
    .from(schema.ventureCycles)
    .where(and(eq(schema.ventureCycles.id, cycleId), eq(schema.ventureCycles.tenantId, tenantId)))
    .limit(1);
  if (!src) throw new Error('cycle not found');
  const next = await db
    .select({ next: sql<number>`coalesce(max(seq), 0) + 1` })
    .from(schema.ventureCycles)
    .where(eq(schema.ventureCycles.ventureId, src.ventureId));
  const seq = next[0]?.next ?? 1;
  const [created] = await db
    .insert(schema.ventureCycles)
    .values({
      tenantId,
      ventureId: src.ventureId,
      seq,
      status: 'open',
      createdBy: userId,
    })
    .returning({ id: schema.ventureCycles.id, seq: schema.ventureCycles.seq });
  if (!created) throw new Error('clone failed');

  // Copy interview answers + competitors + artifact references so the new
  // cycle starts from the previous one's state. Content keys deliberately
  // are NOT copied — synthesis on the new cycle should produce them fresh.
  await db.transaction(async (tx) => {
    const answers = await tx
      .select()
      .from(schema.questionAnswers)
      .where(eq(schema.questionAnswers.cycleId, cycleId));
    if (answers.length > 0) {
      await tx.insert(schema.questionAnswers).values(
        answers.map((a) => ({
          tenantId,
          cycleId: created.id,
          questionId: a.questionId,
          answeredBy: userId,
          rawValue: a.rawValue,
          notes: a.notes,
          version: 1,
        })),
      );
    }
    const competitors = await tx
      .select()
      .from(schema.competitors)
      .where(eq(schema.competitors.cycleId, cycleId));
    if (competitors.length > 0) {
      await tx.insert(schema.competitors).values(
        competitors.map((co) => ({
          tenantId,
          cycleId: created.id,
          url: co.url,
          label: co.label,
          scrapeStatus: 'queued',
          addedBy: userId,
        })),
      );
    }
    const artifacts = await tx
      .select()
      .from(schema.ventureArtifacts)
      .where(eq(schema.ventureArtifacts.cycleId, cycleId));
    if (artifacts.length > 0) {
      // Reference the same S3 objects in the new cycle's row set; the
      // file is owned by the tenant, not the cycle, so this is safe.
      await tx.insert(schema.ventureArtifacts).values(
        artifacts.map((a) => ({
          tenantId,
          cycleId: created.id,
          kind: a.kind,
          fileName: a.fileName,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          s3Key: a.s3Key,
          extractionStatus: a.extractionStatus,
          extractionText: a.extractionText,
          uploadedBy: userId,
        })),
      );
    }
  });

  return created;
};

export const closeCycle = async (tenantId: string, cycleId: string): Promise<void> => {
  const now = new Date();
  await getDb()
    .update(schema.ventureCycles)
    .set({ status: 'closed', closedAt: now, frozenAt: now })
    .where(and(eq(schema.ventureCycles.id, cycleId), eq(schema.ventureCycles.tenantId, tenantId)));
};

export const cycleSummary = async (
  tenantId: string,
  cycleId: string,
): Promise<{
  cycle: typeof schema.ventureCycles.$inferSelect;
  contentKeys: { code: string; value: unknown; version: number }[];
  artifactCount: number;
  competitorCount: number;
  reportCount: number;
}> => {
  const db = getDb();
  const [cycle] = await db
    .select()
    .from(schema.ventureCycles)
    .where(and(eq(schema.ventureCycles.id, cycleId), eq(schema.ventureCycles.tenantId, tenantId)))
    .limit(1);
  if (!cycle) throw new Error('cycle not found');
  const keyRows = await db
    .select({
      code: schema.contentKeys.code,
      value: schema.contentKeys.value,
      version: schema.contentKeys.version,
    })
    .from(schema.contentKeys)
    .where(and(eq(schema.contentKeys.tenantId, tenantId), eq(schema.contentKeys.cycleId, cycleId)))
    .orderBy(desc(schema.contentKeys.version));
  const latest = new Map<string, (typeof keyRows)[number]>();
  for (const r of keyRows) if (!latest.has(r.code)) latest.set(r.code, r);
  const [artifactCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.ventureArtifacts)
    .where(
      and(
        eq(schema.ventureArtifacts.tenantId, tenantId),
        eq(schema.ventureArtifacts.cycleId, cycleId),
        isNull(schema.ventureArtifacts.deletedAt),
      ),
    );
  const [competitorCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.competitors)
    .where(and(eq(schema.competitors.tenantId, tenantId), eq(schema.competitors.cycleId, cycleId)));
  const [reportCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.reports)
    .where(and(eq(schema.reports.tenantId, tenantId), eq(schema.reports.cycleId, cycleId)));
  return {
    cycle,
    contentKeys: Array.from(latest.values()),
    artifactCount: artifactCount?.n ?? 0,
    competitorCount: competitorCount?.n ?? 0,
    reportCount: reportCount?.n ?? 0,
  };
};

export const softDeleteVenture = async (
  tenantId: string,
  ventureId: string,
  userId: string,
): Promise<void> => {
  const db = getDb();
  const restore = new Date(Date.now() + 30 * 86_400_000);
  await db.transaction(async (tx) => {
    await tx
      .update(schema.ventures)
      .set({ deletedAt: new Date() })
      .where(and(eq(schema.ventures.id, ventureId), eq(schema.ventures.tenantId, tenantId)));
    await tx.insert(schema.deletionTombstones).values({
      tenantId,
      targetTable: 'ventures',
      targetId: ventureId,
      deletedBy: userId,
      restoreDeadline: restore,
      payload: {},
    });
  });
};
