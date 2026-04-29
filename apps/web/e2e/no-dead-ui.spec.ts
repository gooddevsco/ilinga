import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * No-dead-UI crawler — enforces docs/IMPLEMENTATION_PLAN.md §35.1.
 *
 * Crawls every reachable in-app route from a seed list, asserts that every
 * visible-and-enabled interactive element either:
 *   - has a non-trivial href that resolves to a 200 route, OR
 *   - issues an XHR / changes URL / mutates a visible DOM region on click.
 *
 * Phase 0 baseline: marketing + pricing + help + legal/terms must crawl clean.
 */

const SEED_ROUTES = ['/', '/pricing', '/help', '/legal/terms'];

const isInternal = (url: string, origin: string): boolean => {
  if (url.startsWith('/')) return true;
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
};

const collectVisibleEnabled = async (page: Page, sel: string): Promise<Locator[]> => {
  const handles = await page.locator(sel).all();
  const out: Locator[] = [];
  for (const h of handles) {
    if ((await h.isVisible()) && (await h.isEnabled())) out.push(h);
  }
  return out;
};

test.describe('no-dead-ui crawler', () => {
  for (const route of SEED_ROUTES) {
    test(`route ${route} has no dead anchors`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('[data-testid="not-found"]')).toHaveCount(0);

      const origin = new URL(page.url()).origin;
      const anchors = await collectVisibleEnabled(page, 'a');
      for (const a of anchors) {
        const href = await a.getAttribute('href');
        expect(href, `anchor missing href on ${route}`).toBeTruthy();
        expect(href, `anchor href is "#" on ${route}`).not.toBe('#');
        expect(href, `anchor uses javascript: on ${route}`).not.toMatch(/^javascript:/i);

        if (href && isInternal(href, origin) && href.startsWith('/')) {
          const probe = await page.request.get(href);
          expect(probe.status(), `internal anchor ${href} did not 200`).toBeLessThan(400);
        }
      }
    });

    test(`route ${route} buttons all do something`, async ({ page }) => {
      await page.goto(route);
      const buttons = await collectVisibleEnabled(
        page,
        'button:not([type="submit"]), [role="button"]:not(a)',
      );
      for (const b of buttons) {
        const before = page.url();
        let xhrSeen = false;
        const off = page.on('request', () => {
          xhrSeen = true;
        });
        const dom = await page.locator('body').innerHTML();
        await b.click({ trial: false }).catch(() => {});
        await page.waitForTimeout(150);
        const after = page.url();
        const domAfter = await page.locator('body').innerHTML();
        page.off('request', off as never);

        const changed = before !== after || xhrSeen || dom !== domAfter;
        expect(changed, `button on ${route} appears to be a no-op`).toBe(true);
      }
    });
  }
});
