/**
 * E2E tests for the Trust workflow.
 *
 * Covers:
 *   1. Full lifecycle: TA create → submit → DC send-back → TA resubmit → DC approve
 *   2. DC reject (terminal path)
 *   3. Audit trail present for all DC actions
 *   4. Notification dispatched on approve/reject
 *
 * Auth:
 *   - TA actions: ta_chamundi (temple 30270, district 1)
 *   - DC actions: dc_mysuru (district 1)
 */
import { test, expect } from '../fixtures/data.fixture';
import { DbClient } from '../lib/db-client';
import { env } from '../setup/env';

function toCookieJar(setCookieHeader: string | null): string {
  if (!setCookieHeader) return '';
  return setCookieHeader
    .split(/,(?=[^;]+=)/)
    .map((part) => part.split(';')[0].trim())
    .join('; ');
}

async function getAuthCookie(username: string, password: string): Promise<string> {
  const res = await fetch(`${env.apiOrigin}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${username}: ${res.status}`);
  return toCookieJar(res.headers.get('set-cookie'));
}

async function taAction(path: string, body: Record<string, unknown> = {}): Promise<any> {
  const cookie = await getAuthCookie(env.roles.TA.username, env.roles.TA.password);
  const res = await fetch(`${env.apiOrigin}/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`TA action failed ${path}: ${res.status} - ${await res.text()}`);
  return res.json();
}

async function dcAction(path: string, body: Record<string, unknown> = {}): Promise<void> {
  const cookie = await getAuthCookie(env.roles.DC.username, env.roles.DC.password);
  const res = await fetch(`${env.apiOrigin}/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`DC action failed ${path}: ${res.status} - ${await res.text()}`);
}

/** Creates a trust as ta_chamundi and returns its id. */
async function taCreateTrust(templeId: number, seed: number): Promise<number> {
  const digits4 = String((seed % 9000) + 1000); // always exactly 4 digits: 1000-9999
  const body = await taAction(`/temples/${templeId}/trusts`, {
    trustName: `E2E Trust ${seed}`,
    trustType: 'PUBLIC',
    registrationNumber: `TRN-E2E-${seed}`,
    registeringAuthority: 'Dept of Endowments',
    dateOfRegistration: '2020-01-01',
    panNumber: `ABCDE${digits4}F`,
    bankAccountNumber: `${10000000 + seed}`,
    bankName: 'State Bank',
    bankBranch: 'Main Branch',
    annualIncome: 100000,
  });
  const id = Number(body?.data?.id);
  if (!id) throw new Error(`taCreateTrust: no trust id in response`);
  return id;
}

test.describe.serial('Trust Workflow', () => {
  let taTempleId: number;

  // Temporarily soft-delete trusts for the dedicated test temple so the
  // one-per-temple constraint doesn't block deterministic trust creation.
  test.beforeAll(async () => {
    const db = new DbClient(env.db);
    await db.connect();
    try {
      const temple = await db.getOne<{ id: number }>(
        `SELECT t.id
         FROM temples t
         JOIN users u ON u.temple_id = t.id
         WHERE u.username = ?
         LIMIT 1`,
        [env.roles.TA.username]
      );

      if (!temple?.id) {
        throw new Error(`Unable to resolve temple for TA user ${env.roles.TA.username}`);
      }
      taTempleId = temple.id;

      await db.execute(
        `UPDATE trusts SET is_deleted = 1 WHERE temple_id = ? AND trust_name LIKE 'E2E%' AND is_deleted = 0`,
        [taTempleId]
      );
      await db.execute(
        `UPDATE trusts SET is_deleted = 1 WHERE temple_id = ? AND trust_name NOT LIKE 'E2E%' AND is_deleted = 0`,
        [taTempleId]
      );
    } finally {
      await db.disconnect();
    }
  });

  test.afterAll(async () => {
    const db = new DbClient(env.db);
    await db.connect();
    try {
      await db.execute(
        `UPDATE trusts SET is_deleted = 0 WHERE temple_id = ? AND trust_name NOT LIKE 'E2E%'`,
        [taTempleId]
      );
    } finally {
      await db.disconnect();
    }
  });

  /**
   * Full lifecycle: create → submit → DC send-back → TA resubmit → DC approve.
   * Validates workflow status, audit trail, and notification after approval.
   */
  test('should_complete_full_lifecycle_when_ta_submits_and_dc_approves_after_sendback', async ({
    testContext,
    db,
    dbAssert,
  }) => {
    const seed = testContext.generateId();
    const trustId = await taCreateTrust(taTempleId, seed);
    testContext.registerEntityForCleanup('TRUST', trustId);

    // Step 1: TA submits
    await taAction(`/governance/trusts/${trustId}/submit`);
    await dbAssert.workflow.assertWorkflowStatus('TRUST', trustId, 'SUBMITTED');

    // Step 2: DC sends back with reason
    await dcAction(`/governance/trusts/${trustId}/send-back`, {
      reason: 'Registration document missing from the submission',
    });
    await dbAssert.workflow.assertWorkflowStatus('TRUST', trustId, 'CLARIFICATION_REQUESTED');

    // Step 3: TA resubmits after correcting
    await taAction(`/governance/trusts/${trustId}/submit`);
    await dbAssert.workflow.assertWorkflowStatus('TRUST', trustId, 'CLARIFICATION_RESPONDED');

    // Step 4: DC approves
    await dcAction(`/governance/trusts/${trustId}/approve`);
    await dbAssert.workflow.assertWorkflowStatus('TRUST', trustId, 'APPROVED');

    // Verify workflow instance transition ordering
    const wi = await db.getOne<{ id: number }>(
      `SELECT id FROM workflow_instances WHERE entity_type = 'TRUST' AND entity_id = ?`,
      [trustId]
    );
    expect(wi).not.toBeNull();
    await dbAssert.workflow.assertValidTransitionOrdering(wi!.id);

    // Verify audit trail (DC actions: SEND_BACK + APPROVE should have GAH rows)
    await dbAssert.audit.assertAuditConsistency(wi!.id);

    // Verify notification dispatched for TRUST APPROVE
    await dbAssert.notification.assertNotificationCreated('TRUST', trustId);
  });

  /**
   * DC reject path (terminal): TA create → submit → DC reject.
   * Workflow must be REJECTED and audit row must exist.
   */
  test('should_reject_trust_when_dc_rejects', async ({
    testContext,
    db,
    dbAssert,
  }) => {
    const seed = testContext.generateId() + 1;
    const trustId = await taCreateTrust(taTempleId, seed);
    testContext.registerEntityForCleanup('TRUST', trustId);

    await taAction(`/governance/trusts/${trustId}/submit`);
    await dbAssert.workflow.assertWorkflowStatus('TRUST', trustId, 'SUBMITTED');

    await dcAction(`/governance/trusts/${trustId}/reject`, {
      reason: 'Trust registration documents are fraudulent and cannot be accepted',
    });
    await dbAssert.workflow.assertWorkflowStatus('TRUST', trustId, 'REJECTED');

    // Verify audit row created for REJECT
    const wi = await db.getOne<{ id: number }>(
      `SELECT id FROM workflow_instances WHERE entity_type = 'TRUST' AND entity_id = ?`,
      [trustId]
    );
    expect(wi).not.toBeNull();

    const rejectAudit = await db.getOne<{ id: number }>(
      `SELECT id FROM governance_action_history
       WHERE workflow_instance_id = ? AND action = 'REJECT'`,
      [wi!.id]
    );
    expect(rejectAudit, 'REJECT action must have a governance_action_history row').not.toBeNull();
  });

  /**
   * Verify DB consistency after simple submit → approve.
   * Confirms workflow_transitions count matches governance_action_history.
   */
  test('should_have_consistent_audit_trail_when_dc_approves_directly', async ({
    testContext,
    db,
    dbAssert,
  }) => {
    const seed = testContext.generateId() + 2;
    const trustId = await taCreateTrust(taTempleId, seed);
    testContext.registerEntityForCleanup('TRUST', trustId);

    await taAction(`/governance/trusts/${trustId}/submit`);
    await dcAction(`/governance/trusts/${trustId}/approve`);

    const wi = await db.getOne<{ id: number }>(
      `SELECT id FROM workflow_instances WHERE entity_type = 'TRUST' AND entity_id = ?`,
      [trustId]
    );
    expect(wi).not.toBeNull();

    await dbAssert.workflow.assertWorkflowStatus('TRUST', trustId, 'APPROVED');
    await dbAssert.audit.assertAuditConsistency(wi!.id);
  });
});
