import { Worker, Queue, type Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';

/**
 * Artifact scan worker — placeholder ClamAV adapter.
 *
 * In production this calls clamd over TCP and sets artifact_scans.status to
 * 'clean' or 'infected'. In dev/test we mark every artifact 'clean'
 * instantly and then enqueue text extraction for the artifact.
 */

interface ScanJob {
  artifactId: string;
  s3Key: string;
}

const REDIS_URL = process.env.IL_REDIS_URL ?? 'redis://localhost:6379';

export const scanQueueName = 'artifact-scan';
export const scanQueue = new Queue<ScanJob>(scanQueueName, {
  connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
});

const extractQueue = new Queue('artifact-extract', {
  connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
});

export const startScanWorker = (): Worker<ScanJob> => {
  const worker = new Worker<ScanJob>(
    scanQueueName,
    async (job: Job<ScanJob>): Promise<{ status: 'clean' | 'infected' }> => {
      const db = getDb();
      const status = 'clean' as const;
      try {
        await db
          .update(schema.artifactScans)
          .set({
            status,
            scannedAt: new Date(),
            signatureDbVersion: 'stub-2026-05-03',
          })
          .where(eq(schema.artifactScans.artifactId, job.data.artifactId));
        if (status === 'clean') {
          await extractQueue.add(
            'extract',
            { artifactId: job.data.artifactId },
            { jobId: `extract-${job.data.artifactId}` },
          );
        }
        return { status };
      } catch (err) {
        console.error(`[scan] db error for ${job.data.artifactId}`, err);
        throw err;
      }
    },
    { connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }) },
  );
  worker.on('failed', (job, err) => {
    console.error(`[scan] job ${job?.id} failed`, err);
  });
  return worker;
};
