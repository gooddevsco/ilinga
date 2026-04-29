/* eslint-disable no-console */
import { Worker, Queue, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { and, eq, isNull, lte } from 'drizzle-orm';
import { schema, getDb, closeDb } from '@ilinga/db';

interface RetentionJob {
  kind: 'sweep';
}

const REDIS_URL = process.env.IL_REDIS_URL ?? 'redis://localhost:6379';

export const retentionQueueName = 'retention';
export const retentionQueue = new Queue<RetentionJob>(retentionQueueName, {
  connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
});

export const sweepDueDeletions = async (): Promise<{ processed: number }> => {
  const db = getDb();
  const due = await db
    .select()
    .from(schema.deletionTombstones)
    .where(
      and(
        lte(schema.deletionTombstones.restoreDeadline, new Date()),
        isNull(schema.deletionTombstones.hardDeletedAt),
      ),
    )
    .limit(200);
  let processed = 0;
  for (const t of due) {
    if (t.targetTable === 'tenants') {
      await db
        .update(schema.tenants)
        .set({ deletedAt: new Date() })
        .where(eq(schema.tenants.id, t.targetId));
      // Real impl deletes/archives R2 objects + scrubs PII; we mark
      // hard_deleted_at so retries are idempotent.
    } else if (t.targetTable === 'ventures') {
      await db.delete(schema.ventures).where(eq(schema.ventures.id, t.targetId));
    }
    await db
      .update(schema.deletionTombstones)
      .set({ hardDeletedAt: new Date() })
      .where(eq(schema.deletionTombstones.id, t.id));
    processed += 1;
  }
  return { processed };
};

export const startRetentionWorker = (): Worker<RetentionJob> => {
  const worker = new Worker<RetentionJob>(
    retentionQueueName,
    async (_job: Job<RetentionJob>) => sweepDueDeletions(),
    { connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }) },
  );
  worker.on('failed', (job, err) => {
    console.error(`[retention] job ${job?.id} failed`, err);
  });
  return worker;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  sweepDueDeletions()
    .then((r) => {
      console.warn(`retention sweep done: ${r.processed} rows`);
    })
    .finally(() => closeDb());
}
