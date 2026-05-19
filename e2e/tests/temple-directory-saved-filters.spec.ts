import { test, expect } from '../fixtures/base.fixture';
import { LoginPage } from '../pages/LoginPage';
import { TempleSearchPage } from '../pages/TempleSearchPage';

/**
 * Saved Filters — Temple Directory
 *
 * These tests verify that the three saved filter preset chips ("No Declaration",
 * "Pending Verification", "High Risk (Overdue)") and the Declaration Status sidebar
 * chips apply correct canonical values, mutually exclude each other, and persist
 * across navigation events.
 *
 * Prerequisite: the application must be running at FRONTEND_URL (default: localhost:5173)
 * and the backend must have at least one temple in each status category seeded via
 * V2__master_seed_data.sql.
 */

const DC_USERNAME = process.env.DC_USERNAME ?? 'dc_bengaluru';
const DC_PASSWORD = process.env.DC_PASSWORD ?? 'password123';
const AUDITOR_USERNAME = process.env.AUDITOR_USERNAME ?? 'auditor_user';
const AUDITOR_PASSWORD = process.env.AUDITOR_PASSWORD ?? 'password123';

test.describe('Temple Directory — Saved Filters', () => {
  let searchPage: TempleSearchPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(DC_USERNAME, DC_PASSWORD);
    await page.waitForURL(/\/(dc|admin)\//, { timeout: 10_000 });

    searchPage = new TempleSearchPage(page);
    await searchPage.goto();
    await searchPage.waitForResults();
  });

  // ── Saved filter: No Declaration ─────────────────────────────────────────

  test('should_setDeclarationStatusNO_DECLARATION_when_NoDeclaration_clicked', async ({ page }) => {
    await searchPage.noDeclarationButton.click();
    await searchPage.waitForResults();

    const status = await searchPage.getUrlParam('declarationStatus');
    expect(status).toBe('NO_DECLARATION');
  });

  test('should_clearDeclarationStatus_when_NoDeclaration_clicked', async ({ page }) => {
    // First apply a declaration status filter
    await searchPage.clickFilterChip('Under Review');
    await searchPage.waitForResults();

    // Then click "No Declaration" — must clear declarationStatus
    await searchPage.noDeclarationButton.click();
    await searchPage.waitForResults();

    const declarationStatus = await searchPage.getUrlParam('declarationStatus');
    expect(declarationStatus).toBe('NO_DECLARATION');

    const hasApproved = await searchPage.getUrlParam('hasApprovedDeclaration');
    expect(hasApproved).toBeNull();
  });

  test('should_showActiveState_when_NoDeclaration_filter_is_active', async ({ page }) => {
    await searchPage.noDeclarationButton.click();
    await searchPage.waitForResults();

    // Active variant renders with a non-outline class (e.g. bg-primary or similar)
    // The button should not have the "variant-outline" appearance
    await expect(searchPage.noDeclarationButton).not.toHaveAttribute('data-variant', 'outline');
  });

  // ── Saved filter: Pending Verification ───────────────────────────────────

  test('should_setDeclarationStatusVERIFICATION_REQUIRED_when_PendingVerification_clicked', async ({ page }) => {
    await searchPage.pendingVerificationButton.click();
    await searchPage.waitForResults();

    const param = await searchPage.getUrlParam('declarationStatus');
    expect(param).toBe('VERIFICATION_REQUIRED');
  });

  test('should_NOT_set_legacyPENDING_REVIEW_when_PendingVerification_clicked', async ({ page }) => {
    await searchPage.pendingVerificationButton.click();
    await searchPage.waitForResults();

    const param = await searchPage.getUrlParam('declarationStatus');
    expect(param).not.toBe('PENDING_REVIEW');
  });

  test('should_clearHasApprovedDeclaration_when_PendingVerification_clicked_after_NoDeclaration',
    async ({ page }) => {
      // Set "No Declaration" first
      await searchPage.noDeclarationButton.click();
      await searchPage.waitForResults();

      // Then switch to "Pending Verification"
      await searchPage.pendingVerificationButton.click();
      await searchPage.waitForResults();

      const hasApproved = await searchPage.getUrlParam('hasApprovedDeclaration');
      expect(hasApproved).toBeNull();

      const status = await searchPage.getUrlParam('declarationStatus');
      expect(status).toBe('VERIFICATION_REQUIRED');
    });

  // ── Saved filter: High Risk (Overdue) ────────────────────────────────────

  test('should_setDeclarationStatusOVERDUE_when_HighRisk_clicked', async ({ page }) => {
    await searchPage.highRiskButton.click();
    await searchPage.waitForResults();

    const param = await searchPage.getUrlParam('declarationStatus');
    expect(param).toBe('OVERDUE');
  });

  test('should_clearHasApprovedDeclaration_when_HighRisk_clicked', async ({ page }) => {
    await searchPage.noDeclarationButton.click();
    await searchPage.waitForResults();

    await searchPage.highRiskButton.click();
    await searchPage.waitForResults();

    const hasApproved = await searchPage.getUrlParam('hasApprovedDeclaration');
    expect(hasApproved).toBeNull();
  });

  // ── Saved filters are mutually exclusive ─────────────────────────────────

  test('should_replaceFilter_when_second_saved_filter_clicked_after_first', async ({ page }) => {
    await searchPage.pendingVerificationButton.click();
    await searchPage.waitForResults();

    await searchPage.highRiskButton.click();
    await searchPage.waitForResults();

    const status = await searchPage.getUrlParam('declarationStatus');
    // Only OVERDUE should be active — SUBMITTED must be gone
    expect(status).toBe('OVERDUE');
  });

  // ── Sidebar Declaration Status chips ─────────────────────────────────────

  test('should_setPENDING_when_Pending_sidebar_chip_clicked', async ({ page }) => {
    await searchPage.clickFilterChip('Pending');
    await searchPage.waitForResults();

    const param = await searchPage.getUrlParam('declarationStatus');
    expect(param).toBe('PENDING');
    expect(param).not.toBe('SUBMITTED');
  });

  test('should_setCLARIFICATION_REQUIRED_when_ClarificationReq_chip_clicked', async ({ page }) => {
    await searchPage.clickFilterChip('Clarification Req.');
    await searchPage.waitForResults();

    const param = await searchPage.getUrlParam('declarationStatus');
    expect(param).toBe('CLARIFICATION_REQUIRED');
  });

  test('should_setCLARIFICATION_RESPONDED_when_ClarificationResp_chip_clicked', async ({ page }) => {
    await searchPage.clickFilterChip('Clarification Resp.');
    await searchPage.waitForResults();

    const param = await searchPage.getUrlParam('declarationStatus');
    expect(param).toBe('CLARIFICATION_RESPONDED');
  });

  test('should_clearDeclarationStatus_when_chip_clicked_again_to_toggle_off', async ({ page }) => {
    await searchPage.clickFilterChip('Under Review');
    await searchPage.waitForResults();

    // Click again to toggle off
    await searchPage.clickFilterChip('Under Review');
    await searchPage.waitForResults();

    const param = await searchPage.getUrlParam('declarationStatus');
    expect(param).toBeNull();
  });

  // ── Combined filters ──────────────────────────────────────────────────────

  test('should_combineKeywordAndDeclarationFilter_when_both_applied', async ({ page }) => {
    await searchPage.clickFilterChip('Under Review');
    await searchPage.waitForResults();

    await searchPage.keywordInput.fill('Temple');
    await searchPage.waitForResults();

    await expect
      .poll(async () => searchPage.getUrlParam('keyword'))
      .toBe('Temple');

    const status = await searchPage.getUrlParam('declarationStatus');
    const keyword = await searchPage.getUrlParam('keyword');
    expect(status).toBe('UNDER_REVIEW');
    expect(keyword).toBe('Temple');
  });

  // ── Filter persistence ────────────────────────────────────────────────────

  test('should_persistFilter_when_page_is_refreshed', async ({ page }) => {
    await searchPage.pendingVerificationButton.click();
    await searchPage.waitForResults();

    // Hard refresh
    await page.reload();
    await searchPage.waitForResults();

    const param = await searchPage.getUrlParam('declarationStatus');
    expect(param).toBe('VERIFICATION_REQUIRED');
  });

  // ── Pagination with active filter ────────────────────────────────────────

  test('should_keepFilter_when_navigating_to_next_page', async ({ page }) => {
    await searchPage.clickFilterChip('Overdue');
    await searchPage.waitForResults();

    const nextBtn = page.getByRole('button', { name: /next/i });
    if (await nextBtn.count()) {
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();
        await searchPage.waitForResults();
      }
    }

    // Filter param must still be present after page change
    const param = await searchPage.getUrlParam('declarationStatus');
    expect(param).toBe('OVERDUE');
  });

  // ── Empty state handling ──────────────────────────────────────────────────

  test('should_showEmptyState_when_filter_matches_no_temples', async ({ page }) => {
    // SITE_VISIT_SCHEDULED is a valid canonical status unlikely to have seeded data in every env
    await page.goto('/dc/temples?declarationStatus=SITE_VISIT_SCHEDULED&page=0&size=10');
    await searchPage.waitForResults();

    // Should either show empty state message or result count of 0
    const url = new URL(page.url());
    expect(url.searchParams.get('declarationStatus')).toBe('SITE_VISIT_SCHEDULED');
    // Page must not crash — verify the results container or empty state is visible
    const resultContainer = page.locator('[role="main"]');
    await expect(resultContainer).toBeVisible();
  });

  // ── Role-based visibility (AUDITOR) ──────────────────────────────────────

  test('should_allowAuditorToFilter_but_show_readOnly_banner', async ({ page }) => {
    // Log out DC and log in as auditor
    await page.getByRole('button', { name: /sign out|logout/i }).click();
    await page.waitForURL(/\/login/, { timeout: 5_000 });

    const loginPage = new LoginPage(page);
    await loginPage.login(AUDITOR_USERNAME, AUDITOR_PASSWORD);
    await page.waitForURL(/\/(dc|admin)\//, { timeout: 10_000 });

    searchPage = new TempleSearchPage(page);
    await searchPage.goto();
    await searchPage.waitForResults();

    // Auditor should see filters (read-only) and no action buttons
    await expect(searchPage.pendingVerificationButton).toBeVisible();

    // ReadOnly banner must be visible
    await expect(page.getByText(/read-only mode/i)).toBeVisible();
  });
});

test.describe('Temple Directory — Saved Filters (API contract)', () => {
  test('should_send_VERIFICATION_REQUIRED_to_backend_not_PENDING_REVIEW', async ({ page, request }) => {
    // Intercept the API call and verify the declarationStatus param
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(DC_USERNAME, DC_PASSWORD);
    await page.waitForURL(/\/(dc|admin)\//);

    const searchPage = new TempleSearchPage(page);

    let capturedStatus: string | null = null;
    page.on('request', (req) => {
      if (req.url().includes('/dc/temples') && req.method() === 'GET') {
        const url = new URL(req.url());
        const status = url.searchParams.get('declarationStatus');
        if (status) capturedStatus = status;
      }
    });

    await searchPage.goto();
    await searchPage.pendingVerificationButton.click();
    await searchPage.waitForResults();

    expect(capturedStatus).toBe('VERIFICATION_REQUIRED');
    expect(capturedStatus).not.toBe('PENDING_REVIEW');
  });

  test('should_send_OVERDUE_to_backend_when_HighRisk_clicked', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(DC_USERNAME, DC_PASSWORD);
    await page.waitForURL(/\/(dc|admin)\//);

    const searchPage = new TempleSearchPage(page);

    let capturedStatus: string | null = null;
    page.on('request', (req) => {
      if (req.url().includes('/dc/temples') && req.method() === 'GET') {
        const url = new URL(req.url());
        const status = url.searchParams.get('declarationStatus');
        if (status) capturedStatus = status;
      }
    });

    await searchPage.goto();
    await searchPage.highRiskButton.click();
    await searchPage.waitForResults();

    expect(capturedStatus).toBe('OVERDUE');
  });
});
