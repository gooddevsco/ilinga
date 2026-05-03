import { Worker, type Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';

interface ExtractJob {
  artifactId: string;
}

const REDIS_URL = process.env.IL_REDIS_URL ?? 'redis://localhost:6379';

/**
 * Phase-1 extractor: marks the artifact as extracted with a placeholder
 * text payload. A production deployment swaps in pdf-parse / mammoth /
 * tesseract.js depending on mimeType.
 */
export const startExtractWorker = (): Worker<ExtractJob> => {
  const worker = new Worker<ExtractJob>(
    'artifact-extract',
    async (job: Job<ExtractJob>) => {
      const db = getDb();
      await db
        .update(schema.ventureArtifacts)
        .set({
          extractionStatus: 'complete',
          extractionText: '[stub] artifact text extraction lands with the pdf-parse adapter.',
        })
        .where(eq(schema.ventureArtifacts.id, job.data.artifactId));
    },
    {
      connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
      concurrency: Number.parseInt(process.env.IL_WORKERS_EMBED_CONCURRENCY ?? '4', 10),
    },
  );
  worker.on('failed', (job, err) => {
    console.error(`[extract] job ${job?.id} failed`, err);
  });
  return worker;
};
