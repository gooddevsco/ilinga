import { Worker, Queue, type Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { withPage, verifyAvailable } from './playwright-pool.js';

interface RenderJob {
  reportId: string;
  tenantId: string;
  templateId: string;
  forced: boolean;
  briefName: string;
}

interface RenderResult {
  status: 'complete' | 'failed';
  htmlS3Key?: string;
  pdfS3Key?: string;
  pageCount?: number;
}

const REDIS_URL = process.env.IL_REDIS_URL ?? 'redis://localhost:6379';
const BUCKET = process.env.IL_S3_BUCKET ?? 'ilinga-eu';

/**
 * In production, missing Playwright is a hard failure: callers expect
 * a PDF, not just HTML. Set `IL_RENDER_PDF_REQUIRED=true` (default
 * in production) so the render is marked failed with a clear reason
 * if chromium isn't installed. Dev keeps the soft-fallback so local
 * smoke runs work without `playwright install chromium`.
 */
const PDF_REQUIRED =
  (
    process.env.IL_RENDER_PDF_REQUIRED ?? (process.env.NODE_ENV === 'production' ? 'true' : 'false')
  ).toLowerCase() === 'true';

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

export const renderQueueName = 'report-render';
export const renderQueue = new Queue<RenderJob>(renderQueueName, {
  connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
});

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const get = (root: unknown, path: string): unknown => {
  const segments = path.split('.');
  let cur: unknown = root;
  for (const seg of segments) {
    if (cur && typeof cur === 'object' && seg in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[seg];
    } else {
      return '';
    }
  }
  return cur ?? '';
};

const renderTemplate = (template: string, data: Record<string, unknown>): string => {
  let out = template;
  out = out.replace(
    /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_match, path: string, body: string) => {
      const items = get(data, path);
      if (!Array.isArray(items)) return '';
      return items
        .map((item) =>
          body
            .replace(/\{\{this\.([\w.]+)\}\}/g, (_m, p: string) => escapeHtml(String(get(item, p))))
            .replace(/\{\{this\}\}/g, () =>
              typeof item === 'string' ? escapeHtml(item) : escapeHtml(JSON.stringify(item)),
            ),
        )
        .join('');
    },
  );
  out = out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, path: string) => {
    const v = get(data, path);
    return escapeHtml(
      typeof v === 'string' ? v : v === null || v === undefined ? '' : JSON.stringify(v),
    );
  });
  return out;
};

const upload = async (key: string, body: string | Buffer, contentType: string): Promise<void> => {
  await getS3().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: typeof body === 'string' ? Buffer.from(body, 'utf8') : body,
      ContentType: contentType,
    }),
  );
};

/**
 * Count `/Type /Page` markers in the PDF stream. Robust to the spaces
 * Playwright inserts and to /Pages (the parent node) which doesn't
 * match because of the trailing space + non-`s` character.
 */
const countPdfPages = (buffer: Buffer): number => {
  const haystack = buffer.toString('latin1');
  const matches = haystack.match(/\/Type\s*\/Page[^s]/g);
  return matches?.length ?? 1;
};

export interface RenderPdfResult {
  buffer: Buffer;
  pageCount: number;
}

/**
 * Render HTML to a PDF buffer using the Playwright pool. Throws on
 * any Playwright failure — the caller decides how to surface it.
 */
export const renderPdf = async (html: string, signal?: AbortSignal): Promise<RenderPdfResult> =>
  withPage(
    async (page) => {
      await page.setContent(html, { waitUntil: 'load' });
      const buffer = await page.pdf({ format: 'A4', printBackground: true });
      return { buffer, pageCount: countPdfPages(buffer) };
    },
    { ...(signal ? { signal } : {}) },
  );

export const startRenderWorker = (): Worker<RenderJob, RenderResult> => {
  // Fire-and-log readiness check at boot so the operator sees the warning
  // immediately rather than on the first render that ends up HTML-only.
  void verifyAvailable().then((avail) => {
    if (!avail.ok) {
      const msg = `[render] Playwright unavailable: ${avail.reason}`;
      if (PDF_REQUIRED) {
        console.error(`${msg} — IL_RENDER_PDF_REQUIRED=true; renders will be marked failed`);
      } else {
        console.warn(
          `${msg} — falling back to HTML-only output (set IL_RENDER_PDF_REQUIRED=true to enforce)`,
        );
      }
    }
  });

  const worker = new Worker<RenderJob, RenderResult>(
    renderQueueName,
    async (job: Job<RenderJob>): Promise<RenderResult> => {
      const db = getDb();
      const reports = await db
        .select()
        .from(schema.reports)
        .where(eq(schema.reports.id, job.data.reportId))
        .limit(1);
      const report = reports[0];
      if (!report) throw new Error('report not found');
      const tplRows = await db
        .select()
        .from(schema.reportTemplates)
        .where(eq(schema.reportTemplates.id, job.data.templateId))
        .limit(1);
      const tpl = tplRows[0];
      if (!tpl) throw new Error('template not found');

      const html = renderTemplate(tpl.handlebarsHtml, {
        venture: { name: job.data.briefName ?? '' },
        ...(report.inputKeySnapshot as Record<string, unknown>),
      });
      const htmlKey = `reports/${job.data.tenantId}/${report.id}.html`;
      const pdfKey = `reports/${job.data.tenantId}/${report.id}.pdf`;

      try {
        await upload(htmlKey, html, 'text/html; charset=utf-8');
      } catch (err) {
        console.warn(`[render] HTML upload failed (continuing): ${(err as Error).message}`);
      }

      let pageCount = 1;
      let pdfWritten = false;
      let pdfError: string | null = null;

      try {
        const pdf = await renderPdf(html);
        pageCount = pdf.pageCount;
        await upload(pdfKey, pdf.buffer, 'application/pdf');
        pdfWritten = true;
      } catch (err) {
        pdfError = (err as Error).message;
        console.warn(`[render] PDF render failed: ${pdfError}`);
      }

      const renderRow = await db
        .select()
        .from(schema.reportRenders)
        .where(eq(schema.reportRenders.reportId, report.id))
        .limit(1);
      const existingId = renderRow[0]?.id;

      if (!pdfWritten && PDF_REQUIRED) {
        // Hard fail: callers expect a PDF.
        if (existingId) {
          await db
            .update(schema.reportRenders)
            .set({
              status: 'failed',
              htmlS3Key: htmlKey,
              failureReason: `pdf-render-failed: ${pdfError ?? 'unknown'}`,
              failedAt: new Date(),
            })
            .where(eq(schema.reportRenders.id, existingId));
        }
        return { status: 'failed', htmlS3Key: htmlKey };
      }

      if (existingId) {
        await db
          .update(schema.reportRenders)
          .set({
            status: 'complete',
            htmlS3Key: htmlKey,
            pdfS3Key: pdfWritten ? pdfKey : null,
            completedAt: new Date(),
            pageCount,
            // When PDF rendering soft-failed in dev, surface the reason on
            // the row so the UI can show "PDF unavailable: <reason>".
            failureReason: pdfWritten ? null : pdfError,
          })
          .where(eq(schema.reportRenders.id, existingId));
      }
      console.warn(
        `[render] report ${report.id} -> complete (pdf=${pdfWritten ? 'yes' : 'no'}, pages=${pageCount})`,
      );
      return {
        status: 'complete',
        htmlS3Key: htmlKey,
        ...(pdfWritten ? { pdfS3Key: pdfKey } : {}),
        pageCount,
      };
    },
    {
      connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
      concurrency: Number.parseInt(process.env.IL_WORKERS_RENDER_CONCURRENCY ?? '2', 10),
    },
  );
  worker.on('failed', async (job, err) => {
    console.error(`[render] job ${job?.id} failed`, err);
    if (job) {
      const db = getDb();
      await db
        .update(schema.reportRenders)
        .set({ status: 'failed', failureReason: err.message, failedAt: new Date() })
        .where(eq(schema.reportRenders.reportId, job.data.reportId));
    }
  });
  return worker;
};

export const __testing = { countPdfPages, renderTemplate };
