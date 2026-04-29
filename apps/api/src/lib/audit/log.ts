import { desc } from 'drizzle-orm';
import { schema, getDb, computeRowHash } from '@ilinga/db';

export interface AuditAppendInput {
  tenantId?: string | null;
  actorUserId?: string | null;
  impersonatorUserId?: string | null;
  action: string;
  targetTable?: string | null;
  targetId?: string | null;
  payload?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

/**
 * Append a hash-chained audit row.
 *
 * The previous row's row_hash is read in the same transaction, so the chain
 * stays unbroken under concurrent appends. Cockroach serialisable isolation
 * makes this safe; if there's a write conflict the txn retries.
 */
export const appendAudit = async (input: AuditAppendInput): Promise<void> => {
  const db = getDb();
  await db.transaction(async (tx) => {
    const prevRows = await tx
      .select({ rowHash: schema.auditLog.rowHash })
      .from(schema.auditLog)
      .orderBy(desc(schema.auditLog.seq))
      .limit(1);
    const prevHash = prevRows[0]?.rowHash ?? null;
    const createdAt = new Date();
    const rowLike = {
      tenantId: input.tenantId ?? null,
      actorUserId: input.actorUserId ?? null,
      impersonatorUserId: input.impersonatorUserId ?? null,
      action: input.action,
      targetTable: input.targetTable ?? null,
      targetId: input.targetId ?? null,
      payload: input.payload ?? {},
      createdAt,
    };
    const rowHash = computeRowHash(rowLike, prevHash as Buffer | null);
    await tx.insert(schema.auditLog).values({
      tenantId: rowLike.tenantId,
      actorUserId: rowLike.actorUserId,
      impersonatorUserId: rowLike.impersonatorUserId,
      action: rowLike.action,
      targetTable: rowLike.targetTable,
      targetId: rowLike.targetId,
      payload: rowLike.payload,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      requestId: input.requestId ?? null,
      prevHash: prevHash as Buffer | null,
      rowHash,
      createdAt,
    });
  });
};
