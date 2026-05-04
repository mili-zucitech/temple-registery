import { Page, Locator } from '@playwright/test';

export class DeclarationFormPage {
  readonly page: Page;
  readonly fiscalYearSelect: Locator;
  readonly addAssetButton: Locator;
  readonly submitButton: Locator;
  readonly saveAsDraftButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fiscalYearSelect = page.locator('select[name="fiscalYear"]');
    this.addAssetButton = page.locator('button[data-testid="add-asset"]');
    this.submitButton = page.locator('button[data-testid="submit-declaration"]');
    this.saveAsDraftButton = page.locator('button[data-testid="save-draft"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/ta/declarations/new');
  }

  async selectFiscalYear(year: string): Promise<void> {
    await this.fiscalYearSelect.selectOption(year);
  }

  async addAgriLandAsset(data: {
    surveyNumber: string;
    area: number;
    location: string;
    estimatedValue: number;
  }): Promise<void> {
    await this.addAssetButton.click();
    await this.page.locator('select[name="assetType"]').selectOption('AGRI_LAND');
    
    await this.page.locator('input[name="surveyNumber"]').fill(data.surveyNumber);
    await this.page.locator('input[name="area"]').fill(data.area.toString());
    await this.page.locator('input[name="location"]').fill(data.location);
    await this.page.locator('input[name="estimatedValue"]').fill(data.estimatedValue.toString());
    
    await this.page.locator('button[data-testid="save-asset"]').click();
    await this.page.waitForTimeout(500); // Wait for asset to be added
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
    
    // Wait for confirmation dialog
    const confirmButton = this.page.locator('[data-testid="confirm-submit"]');
    await confirmButton.waitFor({ state: 'visible' });
    await confirmButton.click();
    
    // Wait for submission to complete
    await this.page.waitForURL('**/declarations/**', { timeout: 10000 });
  }

  async getAssetCount(): Promise<number> {
    return this.page.locator('[data-testid="asset-item"]').count();
  }
}
