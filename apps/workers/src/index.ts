import { startScanWorker } from './scan.js';
import { startExtractWorker } from './extract.js';
import { startScrapeWorker } from './scrape.js';
import { startRenderWorker } from './render.js';
import { startRetentionWorker, sweepDueDeletions } from './retention.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  console.warn('ilinga-workers booting');
  startScanWorker();
  startExtractWorker();
  startScrapeWorker();
  startRenderWorker();
  startRetentionWorker();
}

export {
  startScanWorker,
  startExtractWorker,
  startScrapeWorker,
  startRenderWorker,
  startRetentionWorker,
  sweepDueDeletions,
};
export const phase = 17;
