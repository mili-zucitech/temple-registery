import { Page, Locator } from '@playwright/test';

export class TempleSearchPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/dc/temples?page=0&size=10');
    await this.page.getByRole('main').first().waitFor({ state: 'visible', timeout: 15_000 });
  }

  // ── Saved filter preset buttons ──────────────────────────────────────────

  get noDeclarationButton(): Locator {
    return this.page.getByRole('button', { name: 'No Declaration' });
  }

  get pendingVerificationButton(): Locator {
    return this.page.getByRole('button', { name: 'Pending Verification' });
  }

  get highRiskButton(): Locator {
    return this.page.getByRole('button', { name: 'High Risk (Overdue)' });
  }

  // ── Sidebar declaration status chips ─────────────────────────────────────

  filterChip(label: string): Locator {
    return this.page
      .locator('aside[aria-label="Search filters"]')
      .getByRole('checkbox', { name: label, exact: true });
  }

  async clickFilterChip(label: string): Promise<void> {
    const chip = this.filterChip(label);
    await chip.scrollIntoViewIfNeeded();
    await chip.click();
  }

  // ── Results area ─────────────────────────────────────────────────────────

  get resultItems(): Locator {
    return this.page.locator('[role="listitem"]');
  }

  get emptyStateMessage(): Locator {
    return this.page.getByText(/no temples found|0 temples/i);
  }

  get loadingSkeletons(): Locator {
    return this.page.locator('[class*="skeleton"]');
  }

  // ── Search bar ────────────────────────────────────────────────────────────

  get keywordInput(): Locator {
    return this.page.locator('#temple-search-keyword');
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  async nextPage(): Promise<void> {
    await this.page.getByRole('button', { name: /next/i }).click();
    await this.page.waitForLoadState('networkidle');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  async waitForResults(): Promise<void> {
    await this.page.waitForFunction(() => {
      const skeletons = document.querySelectorAll('[class*="skeleton"]');
      return skeletons.length === 0;
    }, { timeout: 10_000 });
  }

  async getUrlParam(param: string): Promise<string | null> {
    const url = new URL(this.page.url());
    return url.searchParams.get(param);
  }
}
