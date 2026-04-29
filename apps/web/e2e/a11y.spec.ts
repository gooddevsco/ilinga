import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const ROUTES = ['/', '/pricing', '/help', '/legal/terms'];

for (const route of ROUTES) {
  test(`a11y: ${route}`, async ({ page }) => {
    await page.goto(route);
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true },
      axeOptions: { runOnly: ['wcag2a', 'wcag2aa'] },
    });
    expect(true).toBe(true);
  });
}
