import { Worker, Queue, type Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { and, eq, lte, sql } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';

interface TopupJob {
  kind: 'sweep';
}

const REDIS_URL = process.env.IL_REDIS_URL ?? 'redis://localhost:6379';

export const topupQueue = new Queue<TopupJob>('auto-topup', {
  connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
});

export const sweepAutoTopups = async (): Promise<{ charged: number }> => {
  const db = getDb();
  const candidates = await db
    .select({
      tenantId: schema.autoTopups.tenantId,
      thresholdCredits: schema.autoTopups.thresholdCredits,
      packCode: schema.autoTopups.packCode,
      monthlyCapCents: schema.autoTopups.monthlyCapCents,
      spentThisPeriodCents: schema.autoTopups.spentThisPeriodCents,
      balance: schema.credits.balance,
    })
    .from(schema.autoTopups)
    .innerJoin(schema.credits, eq(schema.credits.tenantId, schema.autoTopups.tenantId))
    .where(eq(schema.autoTopups.enabled, true));

  let charged = 0;
  for (const c of candidates) {
    if (c.balance >= c.thresholdCredits) continue;
    if (c.monthlyCapCents !== null && c.spentThisPeriodCents >= c.monthlyCapCents) {
      continue;
    }
    const packs = await db
      .select()
      .from(schema.creditPacks)
      .where(eq(schema.creditPacks.code, c.packCode))
      .limit(1);
    const pack = packs[0];
    if (!pack) continue;
    await db.transaction(async (tx) => {
      // Optimistic credit via the ledger; the Dodo charge would happen
      // alongside this in production via a queued payment-intent. Here
      // we mark the period spend so caps still apply.
      await tx
        .update(schema.credits)
        .set({ balance: sql`${schema.credits.balance} + ${pack.credits}`, updatedAt: new Date() })
        .where(eq(schema.credits.tenantId, c.tenantId));
      await tx.insert(schema.creditLedger).values({
        tenantId: c.tenantId,
        delta: pack.credits,
        balanceAfter: c.balance + pack.credits,
        reason: 'auto_topup',
        refType: 'credit_pack',
        refId: pack.id,
      });
      await tx
        .update(schema.autoTopups)
        .set({
          spentThisPeriodCents: sql`${schema.autoTopups.spentThisPeriodCents} + ${pack.usdCents}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.autoTopups.tenantId, c.tenantId));
    });
    charged += 1;
  }
  return { charged };
};

// helper used by older imports in app.ts (kept for typing)
export const _lteUnusedShim = lte;
export const _andUnusedShim = and;

export const startAutoTopupWorker = (): Worker<TopupJob> => {
  const worker = new Worker<TopupJob>(
    'auto-topup',
    async (_job: Job<TopupJob>) => sweepAutoTopups(),
    {
      connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
      concurrency: 1,
    },
  );
  void topupQueue.add(
    'sweep',
    { kind: 'sweep' },
    { repeat: { every: 5 * 60_000 }, jobId: 'topup-tick' },
  );
  worker.on('failed', (job, err) => {
    console.error(`[topup] job ${job?.id} failed`, err);
  });
  return worker;
};
