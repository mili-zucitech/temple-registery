/**
 * E2E tests for the Notification Inbox flow.
 *
 * Covers:
 *   1. Notification is created in in_app_notifications after a declaration is approved
 *   2. TA can view the notification in the inbox page (unread badge visible)
 *   3. TA can mark a single notification as read
 *   4. TA can mark all notifications as read
 *   5. No duplicate notifications are created for the same event
 *   6. Outbox consistency â€” every approved/submitted workflow has an outbox entry
 *
 * Auth: All declaration create/submit calls use ta_chamundi credentials.
 * DC actions use dc_mysuru credentials.
 * Never uses super_admin for declaration creation (TEMPLE_AUTHORITY_ONLY endpoint).
 */
import { test, expect } from '../fixtures/data.fixture';

const INBOX_PATH = '/notifications';

function toCookieJar(setCookieHeader: string | null): string {
  if (!setCookieHeader) return '';
  return setCookieHeader
    .split(/,(?=[^;]+=)/)
    .map((part) => part.split(';')[0].trim())
    .join('; ');
}

async function getAuthCookie(username: string, password: string): Promise<string> {
  const response = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(`Login failed for ${username}: ${response.status}`);
  }
  return toCookieJar(response.headers.get('set-cookie'));
}

async function taAction(path: string, body: Record<string, unknown> = {}): Promise<any> {
  const cookie = await getAuthCookie('ta_chamundi', 'password123');
  const res = await fetch(`http://localhost:8080/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`TA action failed ${path}: ${res.status} - ${await res.text()}`);
  }
  return res.json();
}

async function dcAction(path: string, body: Record<string, unknown> = {}): Promise<void> {
  const cookie = await getAuthCookie('dc_mysuru', 'password123');
  const res = await fetch(`http://localhost:8080/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`DC action failed ${path}: ${res.status} - ${await res.text()}`);
  }
}

/** Create + submit a declaration as ta_chamundi, return the declaration id. */
async function taCreateAndSubmit(templeId: number, fiscalYear: string): Promise<number> {
  const body = await taAction(`/temples/${templeId}/declarations`, {
    financialYear: fiscalYear,
    dueDate: '2026-03-31',
    annualIncome: 0,
    annualExpenditure: 0,
  });
  const id = Number(body?.data?.id);
  if (!id) throw new Error(`taCreateAndSubmit: no declaration id in response`);
  await taAction(`/governance/declarations/${id}/submit`);
  return id;
}

function uniqueYear(seed: number): string {
  // Include a time component so repeated runs don't reuse the same fiscal years.
  const timeSalt = Math.floor(Date.now() / 1000) % 7000;
  const start = 1100 + ((seed + timeSalt) % 7000);
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

test.describe('Notification Inbox', () => {

  /**
   * After DC approves a declaration the WorkflowEngine publishes an outbox event
   * which NotificationRouter picks up and dispatches an InAppNotification row.
   * The TA's inbox page must show the notification with an unread badge.
   */
  test('should_showNotificationInInbox_when_declarationApproved', async ({
    testContext,
    temple,
    taPage,
    db,
    dbAssert,
  }) => {
    const declarationId = await taCreateAndSubmit(temple.id, uniqueYear(testContext.generateId()));
    testContext.registerEntityForCleanup('DECLARATION', declarationId);

    await dcAction(`/governance/declarations/${declarationId}/approve`, { remarks: 'E2E approval' });

    // Assert: at least one in_app_notifications row for this declaration's workflow instance
    await dbAssert.notification.assertNotificationCreated('DECLARATION', declarationId);

    // Assert: TA inbox page shows unread badge
    await taPage.goto(INBOX_PATH);
    const unreadBadge = taPage.locator('[data-testid="unread-badge"], [aria-label*="unread"]').first();
    await expect(unreadBadge).toBeVisible({ timeout: 8_000 });
  });

  /**
   * TA marks a single notification as read via the API endpoint.
   * The row's is_read flag must flip in the DB.
   */
  test('should_markNotificationRead_when_taClicksMarkRead', async ({
    testContext,
    temple,
    db,
    dbAssert,
  }) => {
    const declarationId = await taCreateAndSubmit(temple.id, uniqueYear(testContext.generateId()));
    testContext.registerEntityForCleanup('DECLARATION', declarationId);

    await dcAction(`/governance/declarations/${declarationId}/approve`, { remarks: 'E2E mark-read' });
    await dbAssert.notification.assertNotificationCreated('DECLARATION', declarationId);

    // Get ta_chamundi's user_id and poll for the TA-specific approval notification
    // (created asynchronously after DC approves)
    const taUser = await db.getOne<{ id: number }>(
      `SELECT id FROM users WHERE username = 'ta_chamundi' LIMIT 1`, []
    );
    const wiRow = await db.getOne<{ id: number }>(
      `SELECT id FROM workflow_instances WHERE entity_type = 'DECLARATION' AND entity_id = ?`,
      [declarationId]
    );

    let notifRow: { id: number } | null = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      notifRow = await db.getOne<{ id: number }>(
        `SELECT id FROM in_app_notifications WHERE workflow_instance_id = ? AND user_id = ? LIMIT 1`,
        [wiRow!.id, taUser!.id]
      );
      if (notifRow) break;
      await new Promise((r) => setTimeout(r, 500));
    }
    expect(notifRow, 'TA approval notification not found in 5s').not.toBeNull();

    // Act: mark as read via TA API
    await taAction(`/notifications/${notifRow!.id}/read`);

    // Assert: is_read = 1 in DB (for TA user only)
    const unread = await db.query<{ id: number }>(
      `SELECT id FROM in_app_notifications WHERE workflow_instance_id = ? AND user_id = ? AND is_read = 0`,
      [wiRow!.id, taUser!.id],
    );
    expect(unread).toHaveLength(0);
  });

  /**
   * TA marks all notifications as read via the mark-all-read API endpoint.
   */
  test('should_markAllNotificationsRead_when_taClicksMarkAllRead', async ({
    testContext,
    temple,
    db,
    dbAssert,
  }) => {
    const fy1 = uniqueYear(testContext.generateId());
    const fy2 = uniqueYear(testContext.generateId() + 1000);
    const d1Id = await taCreateAndSubmit(temple.id, fy1);
    const d2Id = await taCreateAndSubmit(temple.id, fy2);
    testContext.registerEntityForCleanup('DECLARATION', d1Id);
    testContext.registerEntityForCleanup('DECLARATION', d2Id);

    await dcAction(`/governance/declarations/${d1Id}/approve`, { remarks: 'E2E mark-all 1' });
    await dcAction(`/governance/declarations/${d2Id}/approve`, { remarks: 'E2E mark-all 2' });

    await dbAssert.notification.assertNotificationCreated('DECLARATION', d1Id);
    await dbAssert.notification.assertNotificationCreated('DECLARATION', d2Id);

    // Act: mark all read via TA API
    await taAction('/notifications/read-all');

    // Assert: no unread rows for the two test declarations belonging to ta_chamundi
    const taUser = await db.getOne<{ id: number }>(
      `SELECT id FROM users WHERE username = 'ta_chamundi' LIMIT 1`, []
    );
    const wi1 = await db.getOne<{ id: number }>(
      `SELECT id FROM workflow_instances WHERE entity_type = 'DECLARATION' AND entity_id = ?`, [d1Id]
    );
    const wi2 = await db.getOne<{ id: number }>(
      `SELECT id FROM workflow_instances WHERE entity_type = 'DECLARATION' AND entity_id = ?`, [d2Id]
    );
    const remainingUnread = await db.query<{ id: number }>(
      `SELECT id FROM in_app_notifications WHERE workflow_instance_id IN (?, ?) AND user_id = ? AND is_read = 0`,
      [wi1!.id, wi2!.id, taUser!.id]
    );
    expect(remainingUnread).toHaveLength(0);
  });

  /**
   * Outbox consistency: every workflow in SUBMITTED or APPROVED state must
   * have a corresponding notification_outbox entry (no silent drops).
   */
  test('should_haveOutboxEntries_for_allSubmittedAndApprovedWorkflows', async ({
    testContext,
    temple,
    dbAssert,
  }) => {
    const declarationId = await taCreateAndSubmit(temple.id, uniqueYear(testContext.generateId()));
    testContext.registerEntityForCleanup('DECLARATION', declarationId);

    await dbAssert.notification.assertOutboxConsistency();
  });

  /**
   * Deduplication guard: approving once must not produce duplicate notifications.
   */
  test('should_notCreateDuplicateNotifications_when_approvedOnce', async ({
    testContext,
    temple,
    dbAssert,
  }) => {
    const declarationId = await taCreateAndSubmit(temple.id, uniqueYear(testContext.generateId()));
    testContext.registerEntityForCleanup('DECLARATION', declarationId);

    await dcAction(`/governance/declarations/${declarationId}/approve`, { remarks: 'E2E dedup' });

    // Small delay to let outbox processor flush
    await new Promise((r) => setTimeout(r, 3_000));

    await dbAssert.notification.assertNoDuplicateNotifications();
  });
});
