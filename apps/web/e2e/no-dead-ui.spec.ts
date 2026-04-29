import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * No-dead-UI crawler — enforces docs/IMPLEMENTATION_PLAN.md §35.1.
 *
 * Crawls every public route (auth-gated routes are crawled in their own phase
 * spec with a seeded session). Asserts no anchor uses href="#" or
 * javascript:..., no internal anchor 404s, and every visible-and-enabled
 * button or role=button does *something* on click (URL change, XHR, or DOM
 * mutation).
 */

const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/help',
  '/help/getting-started',
  '/help/glossary',
  '/help/billing',
  '/help/security',
  '/help/api',
  '/help/contact',
  '/legal/terms',
  '/legal/privacy',
  '/legal/dpa',
  '/legal/cookies',
  '/legal/security',
  '/status',
  '/developers/docs',
  '/sign-in',
  '/sign-up',
  '/errors/403',
  '/errors/500',
  '/errors/429',
  '/errors/503',
  '/errors/offline',
  '/errors/read-only',
];

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
  for (const route of PUBLIC_ROUTES) {
    test(`route ${route} has no dead anchors or buttons`, async ({ page }) => {
      await page.goto(route);
      // explicit error pages legitimately render data-testid="not-found"
      if (!route.startsWith('/errors')) {
        await expect(page.locator('[data-testid="not-found"]')).toHaveCount(0);
      }
      const origin = new URL(page.url()).origin;
      const anchors = await collectVisibleEnabled(page, 'a');
      for (const a of anchors) {
        const href = await a.getAttribute('href');
        expect(href, `anchor missing href on ${route}`).toBeTruthy();
        expect(href, `anchor href is "#" on ${route}`).not.toBe('#');
        expect(href, `anchor uses javascript: on ${route}`).not.toMatch(/^javascript:/i);
        if (href && isInternal(href, origin) && href.startsWith('/')) {
          const probe = await page.request.get(href).catch(() => null);
          if (probe) expect(probe.status(), `internal anchor ${href} did not 200`).toBeLessThan(400);
        }
      }
      const buttons = await collectVisibleEnabled(
        page,
        'button:not([type="submit"]), [role="button"]:not(a)',
      );
      for (const b of buttons) {
        const before = page.url();
        let xhrSeen = false;
        const handler = (): void => {
          xhrSeen = true;
        };
        page.on('request', handler);
        const dom = await page.locator('body').innerHTML();
        await b.click({ trial: false }).catch(() => {});
        await page.waitForTimeout(150);
        const after = page.url();
        const domAfter = await page.locator('body').innerHTML();
        page.off('request', handler);
        const changed = before !== after || xhrSeen || dom !== domAfter;
        expect(changed, `button on ${route} appears to be a no-op`).toBe(true);
      }
    });
  }
});
