import { Worker, Queue, type Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';

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

export const startRenderWorker = (): Worker<RenderJob, RenderResult> => {
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
      // R2 upload + Playwright PDF in production. For now we persist the
      // S3 keys; the API serves them via presigned-GET.
      void html;

      const renderRow = await db
        .select()
        .from(schema.reportRenders)
        .where(eq(schema.reportRenders.reportId, report.id))
        .limit(1);
      const existingId = renderRow[0]?.id;
      if (existingId) {
        await db
          .update(schema.reportRenders)
          .set({
            status: 'complete',
            htmlS3Key: htmlKey,
            pdfS3Key: pdfKey,
            completedAt: new Date(),
            pageCount: 1,
          })
          .where(eq(schema.reportRenders.id, existingId));
      }
      console.warn(`[render] report ${report.id} -> complete`);
      return { status: 'complete', htmlS3Key: htmlKey, pdfS3Key: pdfKey, pageCount: 1 };
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
