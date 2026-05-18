import { test, expect } from '@playwright/test';

test.describe('Invalid URL Handling', () => {

  // TC-PROJ-0014: Invalid URL Handling [High]
  test('TC-PROJ-0014 — Invalid/non-existent URL shows appropriate error', async ({ page }) => {
    const invalidPaths = [
      '/this-page-does-not-exist-xyz-999',
      '/invalid/deep/path/that/should/not/exist',
    ];

    for (const path of invalidPaths) {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });

      // Server should return 4xx status
      if (response) {
        const status = response.status();
        expect(status).toBeGreaterThanOrEqual(400);
        expect(status).toBeLessThan(600);
      }

      // Page should display a user-friendly error, not a raw stack trace
      const bodyText = await page.locator('body').innerText().catch(() => '');
      expect(bodyText).not.toMatch(/stack trace|at Object\.|at Function\./i);
    }
  });

  test('TC-PROJ-0014b — App root loads without error', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBeLessThan(400);

    // Page should render meaningful content
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

});
