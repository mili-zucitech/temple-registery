import { Page, Locator } from '@playwright/test';

export class TrustFormPage {
  readonly page: Page;
  readonly trustNameInput: Locator;
  readonly registrationNumberInput: Locator;
  readonly panNumberInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.trustNameInput = page.locator('input[name="trustName"]');
    this.registrationNumberInput = page.locator('input[name="trustRegistrationNumber"]');
    this.panNumberInput = page.locator('input[name="panNumber"]');
    this.submitButton = page.locator('button[data-testid="submit-trust"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/ta/trusts/new');
  }

  async fillBasicInfo(data: {
    trustName: string;
    registrationNumber: string;
    panNumber: string;
  }): Promise<void> {
    await this.trustNameInput.fill(data.trustName);
    await this.registrationNumberInput.fill(data.registrationNumber);
    await this.panNumberInput.fill(data.panNumber);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
    
    // Wait for confirmation
    const confirmButton = this.page.locator('[data-testid="confirm-submit"]');
    await confirmButton.waitFor({ state: 'visible' });
    await confirmButton.click();
    
    // Wait for submission to complete
    await this.page.waitForURL('**/trusts/**', { timeout: 10000 });
  }
}
