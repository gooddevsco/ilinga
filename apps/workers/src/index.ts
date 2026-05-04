import './env-bootstrap.js';
import { startScanWorker } from './scan.js';
import { startExtractWorker } from './extract.js';
import { startScrapeWorker } from './scrape.js';
import { startRenderWorker } from './render.js';
import { startSchedulerWorker } from './scheduler.js';
import { startReminderWorker } from './reminders.js';
import { startAutoTopupWorker } from './auto-topup.js';
import { startRetentionWorker, sweepDueDeletions } from './retention.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  console.warn('ilinga-workers booting');
  startScanWorker();
  startExtractWorker();
  startScrapeWorker();
  startRenderWorker();
  startSchedulerWorker();
  startReminderWorker();
  startAutoTopupWorker();
  startRetentionWorker();
}

export {
  startScanWorker,
  startExtractWorker,
  startScrapeWorker,
  startRenderWorker,
  startSchedulerWorker,
  startReminderWorker,
  startAutoTopupWorker,
  startRetentionWorker,
  sweepDueDeletions,
};
export const phase = 18;
