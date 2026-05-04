import { Worker, type Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

interface ExtractJob {
  artifactId: string;
}

const REDIS_URL = process.env.IL_REDIS_URL ?? 'redis://localhost:6379';
const BUCKET = process.env.IL_S3_BUCKET ?? 'ilinga-eu';
const MAX_BYTES = Number.parseInt(process.env.IL_EXTRACT_MAX_BYTES ?? `${50 * 1024 * 1024}`, 10);

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

const fetchBytes = async (key: string): Promise<Buffer> => {
  const res = await getS3().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const stream = res.Body as NodeJS.ReadableStream | undefined;
  if (!stream) throw new Error('artifact body missing');
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.byteLength;
    if (total > MAX_BYTES) {
      throw new Error(`artifact exceeds ${MAX_BYTES} bytes`);
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
};

const stripControl = (text: string): string => {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    // keep tab (9), LF (10), CR (13); strip everything else below 0x20 + DEL.
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)) {
      out += text[i];
    }
  }
  return out;
};

const trim = (text: string, max = 200_000): string => {
  const collapsed = stripControl(text)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return collapsed.length > max ? `${collapsed.slice(0, max)}\n\n[truncated]` : collapsed;
};

interface ExtractResult {
  text: string;
  meta: Record<string, string | number>;
}

const extractPdf = async (bytes: Buffer): Promise<ExtractResult> => {
  const mod = (await import('pdf-parse')) as unknown as {
    default?: (
      b: Buffer,
    ) => Promise<{ text: string; numpages: number; info?: Record<string, unknown> }>;
  } & ((b: Buffer) => Promise<{ text: string; numpages: number; info?: Record<string, unknown> }>);
  const fn = mod.default ?? mod;
  const out = await fn(bytes);
  return {
    text: trim(out.text ?? ''),
    meta: { pages: out.numpages ?? 0, kind: 'pdf' },
  };
};

const extractDocx = async (bytes: Buffer): Promise<ExtractResult> => {
  const mod = (await import('mammoth')) as unknown as {
    extractRawText: (input: { buffer: Buffer }) => Promise<{ value: string }>;
  };
  const out = await mod.extractRawText({ buffer: bytes });
  return { text: trim(out.value ?? ''), meta: { kind: 'docx' } };
};

const extractPlain = (bytes: Buffer): ExtractResult => ({
  text: trim(bytes.toString('utf8')),
  meta: { kind: 'text' },
});

const dispatch = async (mimeType: string | null, bytes: Buffer): Promise<ExtractResult> => {
  const mt = (mimeType ?? '').toLowerCase();
  if (mt === 'application/pdf' || mt === 'application/x-pdf') return extractPdf(bytes);
  if (mt === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractDocx(bytes);
  }
  if (mt.startsWith('text/') || mt === 'application/json' || mt === 'application/xml') {
    return extractPlain(bytes);
  }
  // Last-resort: try plain UTF-8 read so misconfigured uploads still get
  // something usable. Image / OCR paths land in a follow-up slice.
  return extractPlain(bytes);
};

export const startExtractWorker = (): Worker<ExtractJob> => {
  const worker = new Worker<ExtractJob>(
    'artifact-extract',
    async (job: Job<ExtractJob>) => {
      const db = getDb();
      const rows = await db
        .select({
          id: schema.ventureArtifacts.id,
          mimeType: schema.ventureArtifacts.mimeType,
          s3Key: schema.ventureArtifacts.s3Key,
        })
        .from(schema.ventureArtifacts)
        .where(eq(schema.ventureArtifacts.id, job.data.artifactId))
        .limit(1);
      const artifact = rows[0];
      if (!artifact) {
        return;
      }
      try {
        const bytes = await fetchBytes(artifact.s3Key);
        const out = await dispatch(artifact.mimeType, bytes);
        await db
          .update(schema.ventureArtifacts)
          .set({
            extractionStatus: 'complete',
            extractionText: out.text || '[empty document]',
          })
          .where(eq(schema.ventureArtifacts.id, artifact.id));
      } catch (err) {
        await db
          .update(schema.ventureArtifacts)
          .set({
            extractionStatus: 'failed',
            extractionText: `[extract-failed: ${(err as Error).message.slice(0, 240)}]`,
          })
          .where(eq(schema.ventureArtifacts.id, artifact.id));
        throw err;
      }
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

// Exported for unit tests + future direct-invocation paths.
export const extractFromBuffer = dispatch;
