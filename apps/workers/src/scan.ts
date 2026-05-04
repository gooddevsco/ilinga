import { Worker, Queue, type Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { scanBytes, pingClamd, type ClamdConfig } from './clamd.js';

/**
 * Artifact scan worker — real ClamAV `clamd` zINSTREAM client.
 *
 * Behaviour:
 *  - If `IL_CLAMD_HOST` is set, the worker streams the artifact bytes
 *    over TCP to clamd and writes 'clean' / 'infected' / 'failed' to
 *    artifact_scans accordingly. On 'infected' the artifact is
 *    quarantined (extractionStatus='quarantined') and extraction is
 *    NOT enqueued.
 *  - If `IL_CLAMD_HOST` is unset, the worker writes 'clean' with
 *    signatureDbVersion='no-clamd-configured' so dev mode still flows.
 *    This is the documented fallback — production must set the env var.
 */

interface ScanJob {
  artifactId: string;
  s3Key: string;
}

const REDIS_URL = process.env.IL_REDIS_URL ?? 'redis://localhost:6379';
const BUCKET = process.env.IL_S3_BUCKET ?? 'ilinga-eu';

const clamdCfg = (): ClamdConfig | null => {
  const host = process.env.IL_CLAMD_HOST;
  if (!host) return null;
  return {
    host,
    port: Number.parseInt(process.env.IL_CLAMD_PORT ?? '3310', 10),
    timeoutMs: Number.parseInt(process.env.IL_CLAMD_TIMEOUT_MS ?? '30000', 10),
    maxBytes: Number.parseInt(process.env.IL_CLAMD_MAX_BYTES ?? `${50 * 1024 * 1024}`, 10),
  };
};

let s3: S3Client | null = null;
const getS3 = (): S3Client => {
  if (s3) return s3;
  s3 = new S3Client({
    endpoint: process.env.IL_S3_ENDPOINT,
    region: process.env.IL_S3_REGION ?? 'auto',
    credentials: {
      accessKeyId: process.env.IL_S3_ACCESS_KEY ?? 'mock',
      secretAccessKey: process.env.IL_S3_SECRET_KEY ?? 'mock',
    },
    forcePathStyle: process.env.IL_S3_FORCE_PATH_STYLE === 'true',
  });
  return s3;
};

const fetchBytes = async (key: string, max: number): Promise<Buffer> => {
  const res = await getS3().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const stream = res.Body as NodeJS.ReadableStream | undefined;
  if (!stream) throw new Error('artifact body missing');
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.byteLength;
    if (total > max) throw new Error(`artifact exceeds ${max} bytes`);
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
};

export const scanQueueName = 'artifact-scan';
export const scanQueue = new Queue<ScanJob>(scanQueueName, {
  connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
});

const extractQueue = new Queue('artifact-extract', {
  connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
});

const writeVerdict = async (
  artifactId: string,
  status: 'clean' | 'infected' | 'failed',
  signatureDbVersion: string,
  threatName: string | null,
): Promise<void> => {
  const db = getDb();
  await db
    .update(schema.artifactScans)
    .set({
      status,
      scannedAt: new Date(),
      signatureDbVersion,
      threatName,
    })
    .where(eq(schema.artifactScans.artifactId, artifactId));
  if (status === 'infected') {
    await db
      .update(schema.ventureArtifacts)
      .set({ extractionStatus: 'quarantined', extractionText: null })
      .where(eq(schema.ventureArtifacts.id, artifactId));
  }
};

export const startScanWorker = (): Worker<ScanJob> => {
  const worker = new Worker<ScanJob>(
    scanQueueName,
    async (job: Job<ScanJob>): Promise<{ status: 'clean' | 'infected' | 'failed' }> => {
      const cfg = clamdCfg();
      if (!cfg) {
        await writeVerdict(job.data.artifactId, 'clean', 'no-clamd-configured', null);
        await extractQueue.add(
          'extract',
          { artifactId: job.data.artifactId },
          { jobId: `extract-${job.data.artifactId}` },
        );
        return { status: 'clean' };
      }

      try {
        const bytes = await fetchBytes(job.data.s3Key, cfg.maxBytes ?? 50 * 1024 * 1024);
        const verdict = await scanBytes(cfg, bytes);
        if (verdict.status === 'clean') {
          await writeVerdict(job.data.artifactId, 'clean', 'clamd', null);
          await extractQueue.add(
            'extract',
            { artifactId: job.data.artifactId },
            { jobId: `extract-${job.data.artifactId}` },
          );
          return { status: 'clean' };
        }
        if (verdict.status === 'infected') {
          await writeVerdict(job.data.artifactId, 'infected', 'clamd', verdict.signature);
          // Do NOT enqueue extraction; quarantined.
          return { status: 'infected' };
        }
        await writeVerdict(job.data.artifactId, 'failed', 'clamd', verdict.message.slice(0, 240));
        return { status: 'failed' };
      } catch (err) {
        await writeVerdict(
          job.data.artifactId,
          'failed',
          'clamd',
          (err as Error).message.slice(0, 240),
        );
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

export const __testing = { pingClamd, clamdCfg };
