import { Worker, type Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import * as cheerio from 'cheerio';

interface ScrapeJob {
  competitorId: string;
  url: string;
  tenantId: string;
  cycleId: string;
}

const REDIS_URL = process.env.IL_REDIS_URL ?? 'redis://localhost:6379';

const fetchAndExtract = async (
  url: string,
): Promise<{ text: string; structured: Record<string, unknown> }> => {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'IlingaBot/1.0 (+https://ilinga.com/bot)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  $('script,style,nav,footer,noscript').remove();
  const title = $('title').first().text().trim();
  const description = $('meta[name="description"]').attr('content')?.trim() ?? '';
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() ?? '';
  const text = $('body').text().replace(/\s+/g, ' ').slice(0, 16_000).trim();
  return {
    text,
    structured: { title, description, ogTitle, lengthChars: text.length },
  };
};

export const startScrapeWorker = (): Worker<ScrapeJob> => {
  const worker = new Worker<ScrapeJob>(
    'competitor-scrape',
    async (job: Job<ScrapeJob>) => {
      const db = getDb();
      const { competitorId, url } = job.data;
      try {
        const result = await fetchAndExtract(url);
        await db
          .update(schema.competitors)
          .set({
            scrapeStatus: 'complete',
            scrapedAt: new Date(),
            extractionText: result.text,
            structured: result.structured,
          })
          .where(eq(schema.competitors.id, competitorId));
      } catch (err) {
        await db
          .update(schema.competitors)
          .set({
            scrapeStatus: 'failed',
            scrapedAt: new Date(),
            extractionText: null,
            structured: { error: (err as Error).message },
          })
          .where(eq(schema.competitors.id, competitorId));
      }
    },
    {
      connection: new IORedis(REDIS_URL, { maxRetriesPerRequest: null }),
      concurrency: 4,
    },
  );
  worker.on('failed', (job, err) => {
    console.error(`[scrape] job ${job?.id} failed`, err);
  });
  return worker;
};
