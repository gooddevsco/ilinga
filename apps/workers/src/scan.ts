import { Worker, Queue, type Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';

/**
 * Artifact scan worker — placeholder ClamAV adapter.
 *
 * In production this calls clamd over TCP and sets artifact_scans.status to
 * 'clean' or 'infected'. In dev/test we mark every artifact 'clean' instantly.
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

export const startScanWorker = (): Worker<ScanJob> => {
  const worker = new Worker<ScanJob>(
    scanQueueName,
    async (job: Job<ScanJob>): Promise<{ status: 'clean' | 'infected' }> => {
      // Real impl: open TCP socket to clamd and stream the object from R2 over zINSTREAM.
      console.warn(`[scan] artifact ${job.data.artifactId} -> clean (stub)`);
      return { status: 'clean' };
    },
    { connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }) },
  );
  worker.on('failed', (job, err) => {
    console.error(`[scan] job ${job?.id} failed`, err);
  });
  return worker;
};
