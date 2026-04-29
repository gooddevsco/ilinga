/* eslint-disable no-console */
import { startScanWorker } from './scan.js';
import { startRenderWorker } from './render.js';
import { startRetentionWorker, sweepDueDeletions } from './retention.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  console.warn('ilinga-workers booting');
  startScanWorker();
  startRenderWorker();
  startRetentionWorker();
}

export { startScanWorker, startRenderWorker, startRetentionWorker, sweepDueDeletions };
export const phase = 12;
