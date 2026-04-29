import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';

export const createVenture = async (
  tenantId: string,
  userId: string,
  input: { name: string; industry?: string | null; geos?: string[]; brief?: Record<string, unknown> },
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
  return created;
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
