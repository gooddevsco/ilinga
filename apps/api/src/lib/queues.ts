import { Queue } from 'bullmq';
import { Redis as IORedis } from 'ioredis';

const REDIS_URL = process.env.IL_REDIS_URL ?? 'redis://localhost:6379';

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

export const scanQueue = new Queue('artifact-scan', { connection });
export const extractQueue = new Queue('artifact-extract', { connection });
export const scrapeQueue = new Queue('competitor-scrape', { connection });
export const renderQueue = new Queue('report-render', { connection });
export const synthesisQueue = new Queue('synthesis', { connection });
export const reminderQueue = new Queue('stakeholder-reminders', { connection });
export const scheduleQueue = new Queue('scheduled-renders', { connection });
export const topupQueue = new Queue('auto-topup', { connection });

export const closeQueues = async (): Promise<void> => {
  await Promise.allSettled([
    scanQueue.close(),
    extractQueue.close(),
    scrapeQueue.close(),
    renderQueue.close(),
    synthesisQueue.close(),
    reminderQueue.close(),
    scheduleQueue.close(),
    topupQueue.close(),
  ]);
  await connection.quit();
};
