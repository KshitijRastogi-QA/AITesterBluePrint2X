import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="username" i]').first();
    this.passwordInput = page.locator('input[type="password"]').first();
    this.submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Log in"), button:has-text("Login"), button:has-text("Sign in")').first();
    this.errorMessage = page.locator('[class*="error"], [class*="alert"], [role="alert"], [class*="message"]').first();
    this.forgotPasswordLink = page.locator('a:has-text("Forgot"), a:has-text("forgot"), a:has-text("Reset"), [href*="forgot"], [href*="reset"]').first();
    this.signUpLink = page.locator('a:has-text("Sign up"), a:has-text("sign up"), a:has-text("Free trial"), a:has-text("free trial")').first();
  }

  async navigate() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async getErrorText(): Promise<string> {
    try {
      await this.errorMessage.waitFor({ timeout: 5000 });
      return await this.errorMessage.innerText();
    } catch {
      return '';
    }
  }
}
