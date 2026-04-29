/* eslint-disable no-console */
import { startScanWorker } from './scan.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  console.warn('ilinga-workers booting');
  startScanWorker();
}

export { startScanWorker };
export const phase = 5;
