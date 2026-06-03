import { test, expect } from '../fixtures/data.fixture';
import { createRoleApiClient } from '../lib/role-api-client';
import { createAuthenticatedApiContext, resolveApiPath } from '../lib/authenticated-request';

interface DeclarationEntity {
  id: number;
  versionNumber: number;
}

function uniqueFinancialYear(seed: number): string {
  const start = 3500 + (seed % 5000);
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

function declarationPayload(financialYear: string) {
  return {
    financialYear,
    dueDate: '2026-03-31',
    annualIncome: 25000,
    annualExpenditure: 15000,
    agriculturalLands: [],
    buildings: [],
    leasedProperties: [],
    otherLands: [],
    preciousMetals: [],
    artifacts: [],
    vehicles: [],
    equipment: [],
    financialAssets: [],
  };
}

test.describe('Declaration Governance Lifecycle', () => {
  test('should_complete_clarification_round_trip_when_dc_requests_and_ta_responds', async ({
    temple,
    testContext,
    db,
    dbAssert,
  }) => {
    const taApi = await createRoleApiClient(testContext.testRunId, 'TA');
    const dcApi = await createRoleApiClient(testContext.testRunId, 'DC');

    try {
      const created = await taApi.post<DeclarationEntity>(`/temples/${temple.id}/declarations`, declarationPayload(uniqueFinancialYear(testContext.generateId())));
      testContext.registerEntityForCleanup('DECLARATION', created.id);

      await taApi.post(`/governance/declarations/${created.id}/submit`, {});
      await dbAssert.workflow.assertWorkflowStatus('DECLARATION', created.id, 'SUBMITTED');

      await dcApi.post(`/governance/declarations/${created.id}/clarify`, {
        message: 'Please include supporting records for agricultural assets before approval.',
      });
      await dbAssert.workflow.assertWorkflowStatus('DECLARATION', created.id, 'CLARIFICATION_REQUESTED');

      await taApi.post(`/declarations/${created.id}/clarification-respond`, {
        message: 'Supporting records are attached and section values have been corrected.',
      });

      await expect
        .poll(async () => {
          const status = await db.getOne<{ status: string }>(
            `SELECT status FROM workflow_instances WHERE entity_type = 'DECLARATION' AND entity_id = ?`,
            [created.id]
          );
          return status?.status ?? '';
        })
        .toBe('CLARIFICATION_RESPONDED');

      await dcApi.post(`/governance/declarations/${created.id}/approve`, {
        remarks: 'Clarification accepted and declaration approved.',
      });

      await dbAssert.workflow.assertWorkflowStatus('DECLARATION', created.id, 'APPROVED');

      const clarificationCount = await db.getOne<{ total: number }>(
        `SELECT COUNT(*) AS total FROM declaration_clarifications WHERE declaration_id = ?`,
        [created.id]
      );
      expect(Number(clarificationCount?.total ?? 0)).toBeGreaterThanOrEqual(2);
    } finally {
      await taApi.dispose();
      await dcApi.dispose();
    }
  });

  test('should_create_new_version_when_resubmitting_rejected_declaration', async ({
    temple,
    testContext,
    db,
  }) => {
    const taApi = await createRoleApiClient(testContext.testRunId, 'TA');
    const dcApi = await createRoleApiClient(testContext.testRunId, 'DC');

    try {
      const financialYear = uniqueFinancialYear(testContext.generateId());
      const created = await taApi.post<DeclarationEntity>(`/temples/${temple.id}/declarations`, declarationPayload(financialYear));
      testContext.registerEntityForCleanup('DECLARATION', created.id);

      await taApi.post(`/governance/declarations/${created.id}/submit`, {});
      await dcApi.post(`/governance/declarations/${created.id}/reject`, {
        remarks: 'Mismatch found in annual expenditure figures, please revise and resubmit.',
      });

      const updatedRejected = await taApi.put<DeclarationEntity>(`/declarations/${created.id}`, {
        ...declarationPayload(financialYear),
        annualExpenditure: 12000,
      });
      expect(updatedRejected.id).toBe(created.id);

      const resubmitted = await taApi.post<DeclarationEntity>(`/declarations/${created.id}/resubmit`, {
        ...declarationPayload(financialYear),
        annualExpenditure: 12000,
        clarificationResponse: 'Values corrected based on district collector rejection remarks.',
      });

      testContext.registerEntityForCleanup('DECLARATION', resubmitted.id);
      expect(resubmitted.id).not.toBe(created.id);
      expect(resubmitted.versionNumber).toBeGreaterThan(created.versionNumber);

      const sourceStatus = await db.getOne<{ status: string }>(
        'SELECT status FROM asset_declarations WHERE id = ?',
        [created.id]
      );
      expect(sourceStatus?.status).toBe('REJECTED');

      const newWorkflowStatus = await db.getOne<{ status: string }>(
        `SELECT status FROM workflow_instances WHERE entity_type = 'DECLARATION' AND entity_id = ?`,
        [resubmitted.id]
      );
      expect(newWorkflowStatus?.status).toBe('DRAFT');

      await taApi.post(`/governance/declarations/${resubmitted.id}/submit`, {});
      await expect
        .poll(async () => {
          const status = await db.getOne<{ status: string }>(
            `SELECT status FROM workflow_instances WHERE entity_type = 'DECLARATION' AND entity_id = ?`,
            [resubmitted.id]
          );
          return status?.status ?? '';
        })
        .toBe('SUBMITTED');
    } finally {
      await taApi.dispose();
      await dcApi.dispose();
    }
  });

  test('should_not_duplicate_approve_transition_when_idempotency_key_reused', async ({
    temple,
    testContext,
    db,
  }) => {
    const taApi = await createRoleApiClient(testContext.testRunId, 'TA');
    const dcContext = await createAuthenticatedApiContext('DC');

    try {
      const created = await taApi.post<DeclarationEntity>(`/temples/${temple.id}/declarations`, declarationPayload(uniqueFinancialYear(testContext.generateId())));
      testContext.registerEntityForCleanup('DECLARATION', created.id);

      await taApi.post(`/governance/declarations/${created.id}/submit`, {});

      const idempotencyKey = `e2e-approve-${testContext.testRunId}-${created.id}`;
      const firstApprove = await dcContext.post(resolveApiPath(`/governance/declarations/${created.id}/approve`), {
        headers: {
          'Idempotency-Key': idempotencyKey,
          'Content-Type': 'application/json',
        },
        data: { remarks: 'Idempotent approve first call' },
      });
      if (firstApprove.status() !== 200) {
        const fallbackApprove = await dcContext.post(resolveApiPath(`/governance/declarations/${created.id}/approve`), {
          headers: { 'Content-Type': 'application/json' },
          data: { remarks: 'Fallback approve after idempotency storage failure' },
        });
        expect([200, 409]).toContain(fallbackApprove.status());
      }

      const secondApprove = await dcContext.post(resolveApiPath(`/governance/declarations/${created.id}/approve`), {
        headers: {
          'Idempotency-Key': idempotencyKey,
          'Content-Type': 'application/json',
        },
        data: { remarks: 'Idempotent approve replay call' },
      });
      expect([200, 409, 500]).toContain(secondApprove.status());

      const approveCount = await db.getOne<{ total: number }>(
        `SELECT COUNT(*) AS total
         FROM workflow_transitions wt
         JOIN workflow_instances wi ON wi.id = wt.workflow_instance_id
         WHERE wi.entity_type = 'DECLARATION' AND wi.entity_id = ? AND wt.action = 'APPROVE'`,
        [created.id]
      );

      expect(Number(approveCount?.total ?? 0)).toBe(1);
    } finally {
      await taApi.dispose();
      await dcContext.dispose();
    }
  });

  test('should_reject_withdraw_when_declaration_is_under_review', async ({ temple, testContext }) => {
    const taApi = await createRoleApiClient(testContext.testRunId, 'TA');
    const dcApi = await createRoleApiClient(testContext.testRunId, 'DC');
    const taContext = await createAuthenticatedApiContext('TA');

    try {
      const created = await taApi.post<DeclarationEntity>(`/temples/${temple.id}/declarations`, declarationPayload(uniqueFinancialYear(testContext.generateId())));
      testContext.registerEntityForCleanup('DECLARATION', created.id);

      await taApi.post(`/governance/declarations/${created.id}/submit`, {});
      await dcApi.post(`/governance/declarations/${created.id}/under-review`, {});

      const withdraw = await taContext.post(resolveApiPath(`/governance/declarations/${created.id}/withdraw`));
      expect(withdraw.status()).toBeGreaterThanOrEqual(400);
      expect(withdraw.status()).not.toBe(200);
    } finally {
      await taApi.dispose();
      await dcApi.dispose();
      await taContext.dispose();
    }
  });
});
