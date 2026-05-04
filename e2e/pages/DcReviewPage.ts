import { Page, Locator } from '@playwright/test';

export class DcReviewPage {
  readonly page: Page;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly requestClarificationButton: Locator;
  readonly commentTextarea: Locator;
  readonly statusBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.approveButton = page.locator('button[data-testid="approve"]');
    this.rejectButton = page.locator('button[data-testid="reject"]');
    this.requestClarificationButton = page.locator('button[data-testid="request-clarification"]');
    this.commentTextarea = page.locator('textarea[name="comment"]');
    this.statusBadge = page.locator('[data-testid="status-badge"]');
  }

  async gotoDeclaration(declarationId: number): Promise<void> {
    await this.page.goto(`/dc/declarations/${declarationId}`);
  }

  async approve(comment?: string): Promise<void> {
    if (comment) {
      await this.commentTextarea.fill(comment);
    }
    
    await this.approveButton.click();
    
    // Wait for confirmation dialog
    const confirmButton = this.page.locator('[data-testid="confirm-approve"]');
    await confirmButton.waitFor({ state: 'visible' });
    await confirmButton.click();
    
    // Wait for status update
    await this.page.waitForTimeout(1000);
  }

  async reject(reason: string): Promise<void> {
    await this.commentTextarea.fill(reason);
    await this.rejectButton.click();
    
    // Wait for confirmation dialog
    const confirmButton = this.page.locator('[data-testid="confirm-reject"]');
    await confirmButton.waitFor({ state: 'visible' });
    await confirmButton.click();
    
    // Wait for status update
    await this.page.waitForTimeout(1000);
  }

  async requestClarification(message: string): Promise<void> {
    await this.requestClarificationButton.click();
    
    // Fill clarification form
    await this.page.locator('textarea[name="clarificationMessage"]').fill(message);
    await this.page.locator('button[data-testid="send-clarification"]').click();
    
    // Wait for clarification to be sent
    await this.page.waitForTimeout(1000);
  }

  async getStatus(): Promise<string> {
    return this.statusBadge.textContent() || '';
  }
}
