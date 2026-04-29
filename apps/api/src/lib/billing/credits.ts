import { eq, sql } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';

export const creditBalance = async (tenantId: string): Promise<number> => {
  const db = getDb();
  const rows = await db
    .select({ balance: schema.credits.balance })
    .from(schema.credits)
    .where(eq(schema.credits.tenantId, tenantId))
    .limit(1);
  return rows[0]?.balance ?? 0;
};

export const adjustCredits = async (input: {
  tenantId: string;
  delta: number;
  reason: string;
  refType?: string | null;
  refId?: string | null;
  dodoEventId?: string | null;
}): Promise<{ balance: number; alreadyApplied: boolean }> => {
  const db = getDb();
  return db.transaction(async (tx) => {
    if (input.dodoEventId) {
      const dup = await tx
        .select({ id: schema.creditLedger.id })
        .from(schema.creditLedger)
        .where(eq(schema.creditLedger.dodoEventId, input.dodoEventId))
        .limit(1);
      if (dup[0]) {
        const existing = await tx
          .select({ balance: schema.credits.balance })
          .from(schema.credits)
          .where(eq(schema.credits.tenantId, input.tenantId))
          .limit(1);
        return { balance: existing[0]?.balance ?? 0, alreadyApplied: true };
      }
    }
    const updated = await tx
      .update(schema.credits)
      .set({ balance: sql`${schema.credits.balance} + ${input.delta}`, updatedAt: new Date() })
      .where(eq(schema.credits.tenantId, input.tenantId))
      .returning({ balance: schema.credits.balance });
    if (!updated[0]) {
      await tx.insert(schema.credits).values({
        tenantId: input.tenantId,
        balance: input.delta,
        monthlyAllowance: 0,
      });
    }
    const balance = updated[0]?.balance ?? input.delta;
    await tx.insert(schema.creditLedger).values({
      tenantId: input.tenantId,
      delta: input.delta,
      balanceAfter: balance,
      reason: input.reason,
      refType: input.refType ?? null,
      refId: input.refId ?? null,
      dodoEventId: input.dodoEventId ?? null,
    });
    return { balance, alreadyApplied: false };
  });
};

export const setAutoTopup = async (input: {
  tenantId: string;
  enabled: boolean;
  thresholdCredits: number;
  packCode: string;
  monthlyCapCents?: number | null;
}): Promise<void> => {
  const db = getDb();
  const existing = await db
    .select()
    .from(schema.autoTopups)
    .where(eq(schema.autoTopups.tenantId, input.tenantId))
    .limit(1);
  if (existing[0]) {
    await db
      .update(schema.autoTopups)
      .set({
        enabled: input.enabled,
        thresholdCredits: input.thresholdCredits,
        packCode: input.packCode,
        monthlyCapCents: input.monthlyCapCents ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.autoTopups.tenantId, input.tenantId));
  } else {
    await db.insert(schema.autoTopups).values({
      tenantId: input.tenantId,
      enabled: input.enabled,
      thresholdCredits: input.thresholdCredits,
      packCode: input.packCode,
      monthlyCapCents: input.monthlyCapCents ?? null,
    });
  }
};

export const maybeAutoTopUp = async (
  tenantId: string,
  triggerCharge: (packCode: string, capRemaining: number | null) => Promise<{ creditsAdded: number; cents: number } | null>,
): Promise<void> => {
  const db = getDb();
  const cfgRows = await db
    .select()
    .from(schema.autoTopups)
    .where(eq(schema.autoTopups.tenantId, tenantId))
    .limit(1);
  const cfg = cfgRows[0];
  if (!cfg || !cfg.enabled) return;
  const balance = await creditBalance(tenantId);
  if (balance >= cfg.thresholdCredits) return;
  let capRemaining: number | null = null;
  if (cfg.monthlyCapCents !== null) {
    capRemaining = cfg.monthlyCapCents - cfg.spentThisPeriodCents;
    if (capRemaining <= 0) return;
  }
  const result = await triggerCharge(cfg.packCode, capRemaining);
  if (!result) return;
  await db
    .update(schema.autoTopups)
    .set({
      spentThisPeriodCents: sql`${schema.autoTopups.spentThisPeriodCents} + ${result.cents}`,
      updatedAt: new Date(),
    })
    .where(eq(schema.autoTopups.tenantId, tenantId));
  await adjustCredits({
    tenantId,
    delta: result.creditsAdded,
    reason: 'auto_topup',
  });
};
