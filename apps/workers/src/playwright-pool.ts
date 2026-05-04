import type { Browser, BrowserContext, Page } from 'playwright';

/**
 * Singleton chromium pool for the render worker.
 *
 * Why a pool: the previous implementation launched a fresh chromium
 * process per render job, which is ~700ms of overhead per PDF and
 * leaves Playwright's binary unloaded between jobs. A 2-context pool
 * holds the browser hot, so renders within ~100ms of each other reuse
 * the same process.
 *
 * Why a singleton: BullMQ schedules jobs serially per worker (default
 * concurrency 2). Two contexts is enough; more wastes RAM.
 *
 * Lifecycle:
 *  - `withPage(fn)` lazily launches the browser, leases a context +
 *    page, runs the callback, and returns the page to the pool. The
 *    browser stays alive across calls.
 *  - `verifyAvailable()` runs a no-op render on startup and logs a
 *    clear error if chromium isn't installed, so production fails fast
 *    instead of silently HTML-only-ing every render.
 *  - `closeAll()` is exported for graceful shutdown / tests.
 */

let browser: Browser | null = null;
const idle: BrowserContext[] = [];
const POOL_SIZE = Number.parseInt(process.env.IL_RENDER_POOL_SIZE ?? '2', 10);

const getBrowser = async (): Promise<Browser> => {
  if (browser && browser.isConnected()) return browser;
  // Dynamic import lets workers boot even when chromium binary is missing;
  // we surface the real error from withPage / verifyAvailable instead.
  const playwright = await import('playwright');
  browser = await playwright.chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  browser.on('disconnected', () => {
    browser = null;
    idle.length = 0;
  });
  return browser;
};

const acquireContext = async (): Promise<BrowserContext> => {
  const ready = idle.pop();
  if (ready) return ready;
  const b = await getBrowser();
  return b.newContext();
};

const releaseContext = async (ctx: BrowserContext): Promise<void> => {
  if (idle.length < POOL_SIZE) {
    // Clear pages so the next caller starts fresh, then return to pool.
    for (const page of ctx.pages()) {
      await page.close().catch(() => undefined);
    }
    idle.push(ctx);
    return;
  }
  await ctx.close().catch(() => undefined);
};

export interface WithPageOptions {
  signal?: AbortSignal;
}

export const withPage = async <T>(
  fn: (page: Page) => Promise<T>,
  options: WithPageOptions = {},
): Promise<T> => {
  const ctx = await acquireContext();
  let page: Page | null = null;
  const onAbort = (): void => {
    page?.close().catch(() => undefined);
  };
  try {
    page = await ctx.newPage();
    if (options.signal) {
      if (options.signal.aborted) throw new Error('aborted before page creation');
      options.signal.addEventListener('abort', onAbort, { once: true });
    }
    return await fn(page);
  } finally {
    if (options.signal) options.signal.removeEventListener('abort', onAbort);
    if (page && !page.isClosed()) await page.close().catch(() => undefined);
    await releaseContext(ctx);
  }
};

let availabilityCache: { ok: boolean; reason?: string } | null = null;

/**
 * Calls into Playwright once at startup to confirm the chromium binary
 * is installed. Returns { ok: true } when a no-op page can be opened.
 * The result is cached per-process — call `resetAvailabilityCache()`
 * from tests if the answer needs to change.
 */
export const verifyAvailable = async (): Promise<{ ok: boolean; reason?: string }> => {
  if (availabilityCache) return availabilityCache;
  try {
    await withPage(async (page) => {
      await page.setContent('<html><body>ping</body></html>');
    });
    availabilityCache = { ok: true };
    return availabilityCache;
  } catch (err) {
    const message = (err as Error).message;
    availabilityCache = { ok: false, reason: message };
    return availabilityCache;
  }
};

export const resetAvailabilityCache = (): void => {
  availabilityCache = null;
};

export const closeAll = async (): Promise<void> => {
  for (const ctx of idle) await ctx.close().catch(() => undefined);
  idle.length = 0;
  if (browser) {
    await browser.close().catch(() => undefined);
    browser = null;
  }
};
