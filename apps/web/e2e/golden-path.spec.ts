import { test, expect } from '@playwright/test';

/**
 * Golden-path E2E walking the public-facing read-only flows. The
 * authenticated paths (workspace creation, interview, render) require a
 * running API + Cockroach + Mailpit; those are exercised by the integration
 * suite + manual smoke. This test asserts the marketing/auth surface still
 * holds together end-to-end so regressions are caught in CI.
 */

test.describe('golden path (public)', () => {
  test('home → pricing → sign-up → check-your-inbox', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Synthesise venture cycles/i })).toBeVisible();

    await page
      .getByRole('link', { name: /^Pricing$/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.getByRole('heading', { name: /^Pricing$/ })).toBeVisible();

    await page
      .getByRole('link', { name: /Get started/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/sign-up/);
    await expect(page.getByRole('heading', { name: /Create your Ilinga account/i })).toBeVisible();
    await page.getByLabel(/Email/i).fill('e2e@example.test');
    // Accept the consent checkbox.
    await page.getByRole('checkbox').check();
    // We don't have an API in CI so this submit hits a network boundary; the
    // page handles failure by still showing the 'Check your inbox' state
    // (anti-enumeration), which is the contract we want to assert.
    await page.getByRole('button', { name: /Create account/i }).click();
    await expect(page.getByRole('heading', { name: /Confirm your email/i })).toBeVisible();
  });

  test('error pages all render', async ({ page }) => {
    for (const path of [
      '/errors/403',
      '/errors/500',
      '/errors/429',
      '/errors/503',
      '/errors/offline',
      '/errors/read-only',
    ]) {
      await page.goto(path);
      await expect(page.getByRole('link', { name: /Back home/i })).toBeVisible();
    }
  });

  test('command palette opens on ⌘K (where applicable)', async ({ page }) => {
    // Public marketing pages don't mount the palette (auth-only). We assert
    // the keyboard shortcut on the marketing tree is harmless.
    await page.goto('/');
    await page.keyboard.press('Meta+k');
    // No assertion on visibility — just that the page hasn't crashed.
    await expect(page.getByRole('heading', { name: /Synthesise venture cycles/i })).toBeVisible();
  });

  test('stakeholder portal renders the not-found state for a bogus token', async ({ page }) => {
    await page.goto('/s/not-a-real-token-aaaaaaaaaa');
    await expect(page.getByText(/no longer valid/i)).toBeVisible();
  });
});
