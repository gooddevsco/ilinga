import { createHash } from 'node:crypto';
import { and, eq, desc } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';

const stableHash = (obj: unknown): string =>
  createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 32);

export const buildSnapshotForCycle = async (
  tenantId: string,
  cycleId: string,
): Promise<Record<string, unknown>> => {
  const db = getDb();
  const keys = await db
    .select({
      code: schema.contentKeys.code,
      value: schema.contentKeys.value,
      version: schema.contentKeys.version,
    })
    .from(schema.contentKeys)
    .where(and(eq(schema.contentKeys.tenantId, tenantId), eq(schema.contentKeys.cycleId, cycleId)))
    .orderBy(desc(schema.contentKeys.version));
  // collapse to latest by code
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (out[k.code] === undefined) out[k.code] = k.value;
  }
  return out;
};

export const createReport = async (input: {
  tenantId: string;
  cycleId: string;
  templateId: string;
  title: string;
  userId: string;
}): Promise<{ id: string; keysHash: string }> => {
  const db = getDb();
  const snapshot = await buildSnapshotForCycle(input.tenantId, input.cycleId);
  const keysHash = stableHash(snapshot);
  const [row] = await db
    .insert(schema.reports)
    .values({
      tenantId: input.tenantId,
      cycleId: input.cycleId,
      templateId: input.templateId,
      title: input.title,
      inputKeySnapshot: snapshot,
      keysHash,
      createdBy: input.userId,
    })
    .returning({ id: schema.reports.id });
  if (!row) throw new Error('insert failed');
  return { id: row.id, keysHash };
};

export const listReports = (tenantId: string, cycleId: string) =>
  getDb()
    .select()
    .from(schema.reports)
    .where(and(eq(schema.reports.tenantId, tenantId), eq(schema.reports.cycleId, cycleId)))
    .orderBy(desc(schema.reports.createdAt));

export const findReusableRender = async (
  tenantId: string,
  templateId: string,
  keysHash: string,
): Promise<{ id: string; htmlS3Key: string | null; pdfS3Key: string | null } | null> => {
  const db = getDb();
  const reports = await db
    .select()
    .from(schema.reports)
    .where(
      and(
        eq(schema.reports.tenantId, tenantId),
        eq(schema.reports.templateId, templateId),
        eq(schema.reports.keysHash, keysHash),
      ),
    );
  for (const r of reports) {
    const renders = await db
      .select()
      .from(schema.reportRenders)
      .where(
        and(
          eq(schema.reportRenders.reportId, r.id),
          eq(schema.reportRenders.status, 'complete'),
        ),
      )
      .limit(1);
    if (renders[0]) {
      return {
        id: renders[0].id,
        htmlS3Key: renders[0].htmlS3Key,
        pdfS3Key: renders[0].pdfS3Key,
      };
    }
  }
  return null;
};
