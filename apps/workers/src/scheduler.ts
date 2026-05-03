import { Worker, Queue, type Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { and, eq, isNull, lte } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { renderQueue } from './render.js';

interface SchedulerJob {
  kind: 'sweep';
}

const REDIS_URL = process.env.IL_REDIS_URL ?? 'redis://localhost:6379';

export const scheduledRendersQueue = new Queue<SchedulerJob>('scheduled-renders', {
  connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
});

/**
 * Trivial cron parser that only understands the seven cron forms we
 * actually emit from the UI. For unknown forms we conservatively schedule
 * a week ahead so the schedule keeps moving.
 */
const advance = (cron: string, from: Date): Date => {
  // weekly Mondays 09:00 UTC
  if (cron === '0 9 * * 1') {
    const d = new Date(from);
    d.setUTCHours(9, 0, 0, 0);
    while (d <= from || d.getUTCDay() !== 1) {
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return d;
  }
  // daily 09:00 UTC
  if (cron === '0 9 * * *') {
    const d = new Date(from);
    d.setUTCHours(9, 0, 0, 0);
    if (d <= from) d.setUTCDate(d.getUTCDate() + 1);
    return d;
  }
  // monthly first 09:00 UTC
  if (cron === '0 9 1 * *') {
    const d = new Date(from);
    d.setUTCDate(1);
    d.setUTCHours(9, 0, 0, 0);
    if (d <= from) d.setUTCMonth(d.getUTCMonth() + 1);
    return d;
  }
  return new Date(from.getTime() + 7 * 86_400_000);
};

export const sweepScheduledRenders = async (): Promise<{ fired: number }> => {
  const db = getDb();
  const now = new Date();
  const due = await db
    .select()
    .from(schema.reportSchedules)
    .where(and(lte(schema.reportSchedules.nextRunAt, now), isNull(schema.reportSchedules.pausedAt)))
    .limit(200);
  let fired = 0;
  for (const s of due) {
    const reports = await db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, s.reportId))
      .limit(1);
    const report = reports[0];
    if (!report) continue;
    await renderQueue.add(
      'render',
      {
        reportId: report.id,
        tenantId: report.tenantId,
        templateId: report.templateId,
        forced: true,
        briefName: report.title,
      },
      { jobId: `render-${report.id}-${now.getTime()}` },
    );
    await db
      .update(schema.reportSchedules)
      .set({ lastRunAt: now, nextRunAt: advance(s.cron, now) })
      .where(eq(schema.reportSchedules.id, s.id));
    fired += 1;
  }
  return { fired };
};

export const startSchedulerWorker = (): Worker<SchedulerJob> => {
  const worker = new Worker<SchedulerJob>(
    'scheduled-renders',
    async (_job: Job<SchedulerJob>) => sweepScheduledRenders(),
    {
      connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
      concurrency: 1,
    },
  );

  // Tick every minute via a self-scheduling job.
  void scheduledRendersQueue.add(
    'sweep',
    { kind: 'sweep' },
    { repeat: { every: 60_000 }, jobId: 'scheduled-renders-tick' },
  );

  worker.on('failed', (job, err) => {
    console.error(`[scheduler] job ${job?.id} failed`, err);
  });
  return worker;
};
