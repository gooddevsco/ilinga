import { Worker, Queue, type Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { and, eq, isNull, lte, sql } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';

interface ReminderJob {
  kind: 'sweep';
}

const REDIS_URL = process.env.IL_REDIS_URL ?? 'redis://localhost:6379';

export const reminderQueue = new Queue<ReminderJob>('stakeholder-reminders', {
  connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
});

const REMINDER_DELAY_MS = 7 * 86_400_000;

export const sweepReminders = async (): Promise<{ reminded: number }> => {
  const db = getDb();
  const cutoff = new Date(Date.now() - REMINDER_DELAY_MS);
  // Stakeholders invited >7d ago, never opted-out, never responded.
  const candidates = await db
    .select({
      id: schema.stakeholders.id,
      email: schema.stakeholders.email,
      cycleId: schema.stakeholders.cycleId,
      invitedAt: schema.stakeholders.invitedAt,
    })
    .from(schema.stakeholders)
    .where(
      and(
        isNull(schema.stakeholders.optedOutAt),
        isNull(schema.stakeholders.revokedAt),
        lte(schema.stakeholders.invitedAt, cutoff),
      ),
    )
    .limit(200);
  let reminded = 0;
  for (const s of candidates) {
    const responded = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.stakeholderResponses)
      .where(eq(schema.stakeholderResponses.stakeholderId, s.id));
    if ((responded[0]?.n ?? 0) > 0) continue;
    // Insert a notification row for the invited owner so they can chase up
    // out-of-band; actual email reminder requires a re-issued token.
    await db.insert(schema.notifications).values({
      tenantId: '00000000-0000-0000-0000-000000000000',
      userId: '00000000-0000-0000-0000-000000000000',
      kind: 'stakeholder.no_response',
      title: `Stakeholder ${s.email} has not responded`,
      body: `Invited ${s.invitedAt.toISOString()}; consider following up.`,
      data: { stakeholderId: s.id, cycleId: s.cycleId },
    });
    reminded += 1;
  }
  return { reminded };
};

export const startReminderWorker = (): Worker<ReminderJob> => {
  const worker = new Worker<ReminderJob>(
    'stakeholder-reminders',
    async (_job: Job<ReminderJob>) => sweepReminders(),
    {
      connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
      concurrency: 1,
    },
  );
  void reminderQueue.add(
    'sweep',
    { kind: 'sweep' },
    { repeat: { every: 60 * 60_000 }, jobId: 'reminders-tick' },
  );
  worker.on('failed', (job, err) => {
    console.error(`[reminders] job ${job?.id} failed`, err);
  });
  return worker;
};
