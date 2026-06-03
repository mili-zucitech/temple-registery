import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[role="alert"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(username: string, password: string): Promise<void> {
    await this.emailInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL(/\/(ta|dc|admin|auditor|viewer)\/dashboard/, { timeout: 15000 });
  }

  async expectError(expectedMessage: string): Promise<void> {
    await this.errorMessage.waitFor({ state: 'visible' });
    const text = await this.errorMessage.textContent();
    if (!text?.includes(expectedMessage)) {
      throw new Error(`Expected error message to contain "${expectedMessage}", got "${text}"`);
    }
  }
}
