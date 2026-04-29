/* eslint-disable no-console */
import { startScanWorker } from './scan.js';
import { startRenderWorker } from './render.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  console.warn('ilinga-workers booting');
  startScanWorker();
  startRenderWorker();
}

export { startScanWorker, startRenderWorker };
export const phase = 8;
