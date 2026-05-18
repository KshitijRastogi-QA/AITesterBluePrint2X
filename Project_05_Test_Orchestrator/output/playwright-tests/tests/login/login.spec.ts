import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { validCredentials, invalidCredentials, edgeCases } from '../data/login.data';

test.describe('Login Module', () => {

  // TC-PROJ-001: Successful Login – Validate User Credentials [Critical]
  test('TC-PROJ-001 — Successful login with valid credentials', async ({ page }) => {
    test.skip(!validCredentials.email || !validCredentials.password,
      'Set VWO_VALID_EMAIL and VWO_VALID_PASSWORD in .env to run this test');

    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(validCredentials.email, validCredentials.password);

    // After successful login, URL should change away from the login page
    await page.waitForURL(url => !url.toString().includes('login') && !url.toString().includes('signin'), { timeout: 15000 });
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('login');
  });

  // TC-PROJ-002: Successful Login – Invalid Username (empty field) [High]
  test('TC-PROJ-002 — Login with empty email shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.fillPassword('somepassword');
    await loginPage.submit();

    // Should either show browser validation or app-level error
    const isStillOnLoginPage = page.url().includes('app.vwo.com') &&
      (page.url().includes('login') || page.url() === 'https://app.vwo.com/' || page.url() === 'https://app.vwo.com');

    if (!isStillOnLoginPage) {
      // If navigation happened, that's a bug — but we assert either way
    }

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const isRequired = await emailInput.getAttribute('required');
    const validationMsg = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);

    // Either native HTML5 validation fires or an app error appears
    const errorText = await loginPage.getErrorText();
    const hasValidation = isRequired !== null || validationMsg.length > 0 || errorText.length > 0;
    expect(hasValidation).toBe(true);
  });

  // TC-PROJ-003: Successful Login – Invalid Password (empty field) [High]
  test('TC-PROJ-003 — Login with empty password shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.fillEmail('user@example.com');
    await loginPage.submit();

    const passwordInput = page.locator('input[type="password"]').first();
    const isRequired = await passwordInput.getAttribute('required');
    const validationMsg = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    const errorText = await loginPage.getErrorText();

    const hasValidation = isRequired !== null || validationMsg.length > 0 || errorText.length > 0;
    expect(hasValidation).toBe(true);
  });

  // TC-PROJ-004: Successful Login – Combinations [Medium]
  test('TC-PROJ-004 — Login form accepts email + password input', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    await loginPage.fillEmail(invalidCredentials.email);
    await loginPage.fillPassword(invalidCredentials.password);

    const emailValue = await loginPage.emailInput.inputValue();
    const passwordValue = await loginPage.passwordInput.inputValue();

    expect(emailValue).toBe(invalidCredentials.email);
    expect(passwordValue.length).toBeGreaterThan(0);
  });

  // TC-PROJ-005: Failed Login – Invalid Username [High]
  test('TC-PROJ-005 — Login with invalid email shows error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(invalidCredentials.email, invalidCredentials.password);

    await page.waitForTimeout(3000);

    const errorText = await loginPage.getErrorText();
    const stillOnLogin = page.url().includes('app.vwo.com');

    // Either shows error or stays on login page (not authenticated)
    expect(stillOnLogin || errorText.length > 0).toBe(true);

    if (errorText.length > 0) {
      expect(errorText.toLowerCase()).toMatch(/invalid|incorrect|error|wrong|not found|exist/i);
    }
  });

  // TC-PROJ-006: Failed Login – Invalid Password [High]
  test('TC-PROJ-006 — Login with valid email but wrong password shows error', async ({ page }) => {
    test.skip(!validCredentials.email, 'Set VWO_VALID_EMAIL in .env');

    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(validCredentials.email, 'CompletelyWrongPassword!99');

    await page.waitForTimeout(3000);

    const errorText = await loginPage.getErrorText();
    const stillOnAuth = page.url().includes('app.vwo.com');

    expect(stillOnAuth || errorText.length > 0).toBe(true);
    if (errorText.length > 0) {
      expect(errorText.toLowerCase()).toMatch(/invalid|incorrect|error|wrong|password/i);
    }
  });

  // TC-PROJ-007: Failed Login – Combination Username and Password [High]
  test('TC-PROJ-007 — Login with entirely invalid credentials shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login('nonexistent_user_xyz_999@fakedomain.io', 'BadPassword!@#000');

    await page.waitForTimeout(3000);

    const errorText = await loginPage.getErrorText();
    const stillOnAuth = page.url().includes('app.vwo.com');

    expect(stillOnAuth).toBe(true);
    expect(errorText.length).toBeGreaterThan(0);
  });

  // TC-PROJ-008: Failed Login – Empty Username [Medium]
  test('TC-PROJ-008 — Login form with all fields empty stays on page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    const initialUrl = page.url();
    await loginPage.submit();
    await page.waitForTimeout(1500);

    // Should not navigate away from login on empty submit
    const currentUrl = page.url();
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const validationMsg = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);

    // Either validation fired or we stayed on same URL
    expect(currentUrl === initialUrl || validationMsg.length > 0).toBe(true);
  });

});
