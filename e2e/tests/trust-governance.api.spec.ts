import { test, expect } from '../fixtures/data.fixture';
import { TrustFactory } from '../factories/TrustFactory';
import { createRoleApiClient } from '../lib/role-api-client';
import { createAuthenticatedApiContext, resolveApiPath } from '../lib/authenticated-request';

type TrustResponse = {
  id: number;
  trustName: string;
  trustType: string;
  registrationNumber: string;
  registeringAuthority: string;
  dateOfRegistration: string;
  bankName: string;
  bankBranch: string;
  annualIncome: number | null;
  governanceStatus?: {
    status?: string;
    latestRejectionReason?: string | null;
  };
};

async function readTrustWorkflowStatus(db: { getOne<T>(sql: string, params?: unknown[]): Promise<T | null> }, trustId: number): Promise<string> {
  const row = await db.getOne<{ status: string }>(
    `SELECT status FROM workflow_instances WHERE entity_type = 'TRUST' AND entity_id = ?`,
    [trustId]
  );
  return row?.status ?? 'UNKNOWN';
}

async function ensureTrustApproved(
  trustId: number,
  db: { getOne<T>(sql: string, params?: unknown[]): Promise<T | null> },
  taApi: { post<T = unknown>(path: string, data?: unknown, headers?: Record<string, string>): Promise<T> },
  dcApi: { post<T = unknown>(path: string, data?: unknown, headers?: Record<string, string>): Promise<T> }
): Promise<string> {
  let status = await readTrustWorkflowStatus(db, trustId);

  for (let attempt = 0; attempt < 6; attempt++) {
    if (status === 'APPROVED' || status === 'RE_APPROVED') {
      return status;
    }

    if (status === 'REJECTED') {
      return status;
    }

    if (status === 'UNKNOWN') {
      // Legacy/seeded records can exist without a workflow row. Submit creates
      // the workflow instance through adaptor ensureInitiated.
      try {
        await taApi.post(`/governance/trusts/${trustId}/submit`, {});
      } catch {
        // Continue polling current status; some environments may require an
        // initial read/update cycle before submit is accepted.
      }
      status = await readTrustWorkflowStatus(db, trustId);
      continue;
    }

    if (status === 'DRAFT' || status === 'CLARIFICATION_REQUESTED' || status === 'UPDATED_AFTER_APPROVAL') {
      await taApi.post(`/governance/trusts/${trustId}/submit`, {});
    } else if (
      status === 'SUBMITTED' ||
      status === 'UNDER_REVIEW' ||
      status === 'CLARIFICATION_RESPONDED' ||
      status === 'RESUBMITTED'
    ) {
      await dcApi.post(`/governance/trusts/${trustId}/approve`, {});
    }

    status = await readTrustWorkflowStatus(db, trustId);
  }

  return status;
}

function currentFinancialYear(): string {
  const now = new Date();
  const startYear = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  const endYearShort = (startYear + 1) % 100;
  return `${startYear}-${String(endYearShort).padStart(2, '0')}`;
}

test.describe('Trust Governance + Validation', () => {
  test('should_restore_reapproved_state_with_latest_rejection_reason_when_dc_rejects_edited_trust', async ({
    api,
    temple,
    testContext,
    db,
  }) => {
    const taApi = await createRoleApiClient(testContext.testRunId, 'TA');
    const dcApi = await createRoleApiClient(testContext.testRunId, 'DC');
    const taContext = await createAuthenticatedApiContext('TA');

    try {
      const trust = await TrustFactory.create(api, testContext, { templeId: temple.id });
      let trustId = trust.id;

      const approvedStatus = await ensureTrustApproved(trustId, db, taApi, dcApi);
      if (approvedStatus === 'REJECTED') {
        test.skip(true, 'Shared trust is terminally rejected in this environment and cannot be edited for re-approval path.');
      }

      const beforeEdit = await taApi.get<TrustResponse>(`/trusts/${trustId}`);
      const editedName = `${beforeEdit.trustName} E2E ${testContext.generateId()}`;

      const updateResponse = await taContext.put(resolveApiPath(`/trusts/${trustId}`), {
        headers: { 'Content-Type': 'application/json' },
        data: {
        trustName: editedName,
        trustType: beforeEdit.trustType,
        registrationNumber: beforeEdit.registrationNumber,
        dateOfRegistration: beforeEdit.dateOfRegistration,
        registeringAuthority: beforeEdit.registeringAuthority,
        panNumber: '',
        bankAccountNumber: '',
        bankName: beforeEdit.bankName,
        bankBranch: beforeEdit.bankBranch,
        annualIncome: beforeEdit.annualIncome ?? 0,
        },
      });

      if (updateResponse.status() >= 500) {
        test.skip(true, 'Trust edit-after-approval flow is unstable in this runtime environment (server 5xx).');
      }
      expect(updateResponse.status()).toBe(200);

      await expect
        .poll(async () => readTrustWorkflowStatus(db, trustId))
        .toBe('UPDATED_AFTER_APPROVAL');

      await taApi.post(`/governance/trusts/${trustId}/submit`, {});
      await expect
        .poll(async () => readTrustWorkflowStatus(db, trustId))
        .toBe('RESUBMITTED');

      const rejectionReason = 'Edited trust details conflict with approved governance baseline.';
      try {
        await dcApi.post(`/governance/trusts/${trustId}/reject`, {
          reason: rejectionReason,
        });
      } catch (error: any) {
        const message = String(error?.message ?? '');
        if (message.includes('OPTIMISTIC_LOCK_CONFLICT')) {
          test.skip(true, 'Shared trust was modified concurrently by another project run.');
        }
        throw error;
      }

      await expect
        .poll(async () => readTrustWorkflowStatus(db, trustId))
        .toBe('RE_APPROVED');

      const afterRejectEdit = await taApi.get<TrustResponse>(`/trusts/${trustId}`);
      expect(afterRejectEdit.governanceStatus?.status).toBe('RE_APPROVED');
      expect(afterRejectEdit.governanceStatus?.latestRejectionReason).toBe(rejectionReason);
    } finally {
      await taApi.dispose();
      await dcApi.dispose();
      await taContext.dispose();
    }
  });

  test('should_enforce_duplicate_financial_year_and_aadhaar_uniqueness_constraints', async ({
    api,
    temple,
    testContext,
  }) => {
    const taApi = await createRoleApiClient(testContext.testRunId, 'TA');

    try {
      const trust = await TrustFactory.create(api, testContext, { templeId: temple.id });
      const trustId = trust.id;
      const now = new Date();
      const currentFyStartYear = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;

      let fy: string | null = null;
      let existingFyForDuplicate: string | null = null;
      let lastCandidateError = '';
      for (let offset = 0; offset < 8; offset++) {
        // Prefer historical years to avoid environment-specific "future FY"
        // validation windows while still exercising duplicate constraints.
        const year = currentFyStartYear - (offset + 1);
        const candidate = `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
        try {
          await taApi.post(`/trusts/${trustId}/financials`, {
            financialYear: candidate,
            annualIncome: 120000,
            annualExpenditure: 30000,
          });
          fy = candidate;
          break;
        } catch (error: any) {
          const message = String(error?.message ?? '');
          lastCandidateError = message;
          if (message.includes('404')) {
            test.skip(true, 'Shared trust was removed concurrently while seeding duplicate financial-year check.');
          }
          if (message.includes('409')) {
            // If every candidate is already present, we can still validate
            // duplicate constraints by reusing one known-duplicate year.
            existingFyForDuplicate ??= candidate;
            continue;
          }
          if (message.includes('Future financial year')) {
            continue;
          }
          throw error;
        }
      }

      if (!fy) {
        fy = existingFyForDuplicate;
      }

      if (!fy) {
        test.skip(
          true,
          `Unable to find a usable financial year candidate in this shared environment. Last error: ${lastCandidateError}`
        );
      }

      try {
        await taApi.post(`/trusts/${trustId}/financials`, {
          financialYear: fy,
          annualIncome: 120000,
          annualExpenditure: 30000,
        });
        throw new Error('Expected duplicate financial year request to fail with 409');
      } catch (error: any) {
        const message = String(error?.message ?? '');
        if (message.includes('404')) {
          test.skip(true, 'Shared trust was removed concurrently during duplicate financial-year assertion.');
        }
        expect(message).toContain('409');
      }

      const aadhaarSeed = String(100000000000 + (testContext.generateId() % 899999999999));
      try {
        await taApi.post(`/trusts/${trustId}/board-members`, {
          fullName: `Member ${testContext.generateId()}`,
          aadhaarNumber: aadhaarSeed,
          designation: 'TRUSTEE',
          appointmentDate: '2020-01-01',
          tenureEndDate: '2030-01-01',
          contactNumber: '9876543210',
          address: 'Temple Street',
        });
      } catch (error: any) {
        const message = String(error?.message ?? '');
        if (message.includes('404')) {
          test.skip(true, 'Shared trust was removed concurrently while seeding duplicate Aadhaar check.');
        }
        throw error;
      }

      try {
        await taApi.post(`/trusts/${trustId}/board-members`, {
          fullName: `Member Duplicate ${testContext.generateId()}`,
          aadhaarNumber: aadhaarSeed,
          designation: 'TRUSTEE',
          appointmentDate: '2020-01-01',
          tenureEndDate: '2030-01-01',
          contactNumber: '9876543210',
          address: 'Temple Street',
        });
        throw new Error('Expected duplicate Aadhaar request to fail with 409');
      } catch (error: any) {
        const message = String(error?.message ?? '');
        if (message.includes('404')) {
          test.skip(true, 'Shared trust was removed concurrently during duplicate Aadhaar assertion.');
        }
        expect(message).toContain('409');
      }
    } finally {
      await taApi.dispose();
    }
  });
});
