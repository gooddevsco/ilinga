import { test } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const ROUTES = [
  '/',
  '/pricing',
  '/help',
  '/help/contact',
  '/legal/privacy',
  '/sign-in',
  '/sign-up',
  '/status',
];

for (const route of ROUTES) {
  test(`a11y: ${route}`, async ({ page }) => {
    await page.goto(route);
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: false,
      axeOptions: { runOnly: ['wcag2a', 'wcag2aa'] },
    });
  });
}
