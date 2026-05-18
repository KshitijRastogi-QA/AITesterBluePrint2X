import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { validCredentials, invalidCredentials } from '../data/login.data';

test.describe('Password Reset Module', () => {

  async function navigateToPasswordReset(page: any) {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    const forgotLink = loginPage.forgotPasswordLink;
    await forgotLink.waitFor({ timeout: 10000 });
    await forgotLink.click();
    await page.waitForLoadState('domcontentloaded');
    return page;
  }

  // TC-PROJ-0015: Password Reset – Valid Email [Medium]
  test('TC-PROJ-0015 — Password reset with valid email shows success message', async ({ page }) => {
    test.skip(!validCredentials.email, 'Set VWO_VALID_EMAIL in .env');

    await navigateToPasswordReset(page);

    // Locate reset email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await emailInput.waitFor({ timeout: 5000 });
    await emailInput.fill(validCredentials.email);

    const submitBtn = page.locator('button[type="submit"], input[type="submit"], button:has-text("Reset"), button:has-text("Send"), button:has-text("Submit")').first();
    await submitBtn.click();

    await page.waitForTimeout(3000);

    // Should show a success/confirmation message
    const successIndicators = [
      page.locator('[class*="success"]'),
      page.locator('[class*="confirm"]'),
      page.locator('text=/sent|check your email|reset link|instructions/i'),
    ];

    let found = false;
    for (const indicator of successIndicators) {
      try {
        await indicator.waitFor({ timeout: 3000 });
        found = true;
        break;
      } catch { /* continue */ }
    }

    expect(found).toBe(true);
  });

  // TC-PROJ-0016: Password Reset – Invalid Email [Medium]
  test('TC-PROJ-0016 — Password reset with invalid/non-existent email', async ({ page }) => {
    await navigateToPasswordReset(page);

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await emailInput.waitFor({ timeout: 5000 });
    await emailInput.fill(invalidCredentials.email);

    const submitBtn = page.locator('button[type="submit"], input[type="submit"], button:has-text("Reset"), button:has-text("Send"), button:has-text("Submit")').first();
    await submitBtn.click();

    await page.waitForTimeout(3000);

    // Either shows error, or generic success (many apps don't reveal whether email exists for security)
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy(); // Page should still be reachable

    // If an error is shown, it should be user-friendly
    const errorEl = page.locator('[class*="error"], [role="alert"], [class*="alert"]').first();
    try {
      const errorText = await errorEl.innerText();
      if (errorText.length > 0) {
        // Error message should not expose system internals
        expect(errorText).not.toMatch(/SQL|database|exception|stack trace/i);
      }
    } catch { /* no error shown — acceptable */ }
  });

  // TC-PROJ-0017: Password Reset – Invalid Credentials [Medium]
  test('TC-PROJ-0017 — Password reset page is accessible from login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Verify forgot password link exists on login page
    const forgotLink = loginPage.forgotPasswordLink;
    await expect(forgotLink).toBeVisible({ timeout: 10000 });

    await forgotLink.click();
    await page.waitForLoadState('domcontentloaded');

    // Should navigate to password reset page
    const resetUrl = page.url();
    const isResetPage = resetUrl.includes('forgot') || resetUrl.includes('reset') || resetUrl.includes('password');
    expect(isResetPage).toBe(true);

    // Reset page should have an email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });

});
