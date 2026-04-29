/* eslint-disable no-console */
import { asc } from 'drizzle-orm';
import { schema, getDb, closeDb, verifyChainSegment } from '@ilinga/db';

const main = async (): Promise<void> => {
  const db = getDb();
  const rows = await db
    .select({
      tenantId: schema.auditLog.tenantId,
      actorUserId: schema.auditLog.actorUserId,
      impersonatorUserId: schema.auditLog.impersonatorUserId,
      action: schema.auditLog.action,
      targetTable: schema.auditLog.targetTable,
      targetId: schema.auditLog.targetId,
      payload: schema.auditLog.payload,
      createdAt: schema.auditLog.createdAt,
      prevHash: schema.auditLog.prevHash,
      rowHash: schema.auditLog.rowHash,
    })
    .from(schema.auditLog)
    .orderBy(asc(schema.auditLog.seq));
  const result = verifyChainSegment(
    rows.map((r) => ({
      ...r,
      prevHash: (r.prevHash as Buffer | null) ?? null,
      rowHash: r.rowHash as Buffer,
    })),
  );
  if (result.ok) {
    console.warn(`audit chain ok: ${rows.length} rows verified`);
    process.exit(0);
  } else {
    console.error(`audit chain BROKEN at index ${result.brokenAt}`);
    process.exit(2);
  }
};

main()
  .catch(async (err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => closeDb());
