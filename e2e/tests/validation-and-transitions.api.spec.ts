import { test, expect } from '../fixtures/data.fixture';
import { TrustFactory } from '../factories/TrustFactory';
import { createRoleApiClient } from '../lib/role-api-client';
import { createAuthenticatedApiContext, resolveApiPath } from '../lib/authenticated-request';

function uniqueFinancialYear(seed: number): string {
  const start = 4700 + (seed % 3000);
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

function declarationPayload(financialYear: string) {
  return {
    financialYear,
    dueDate: '2026-03-31',
    annualIncome: 7000,
    annualExpenditure: 2500,
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

function nextFinancialYear(): string {
  const now = new Date();
  const currentStart = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  const nextStart = currentStart + 1;
  return `${nextStart}-${String((nextStart + 1) % 100).padStart(2, '0')}`;
}

test.describe('Validation + Transition Guards', () => {
  test('should_prevent_duplicate_declaration_for_same_temple_and_financial_year', async ({
    temple,
    testContext,
  }) => {
    const taApi = await createRoleApiClient(testContext.testRunId, 'TA');
    const taContext = await createAuthenticatedApiContext('TA');

    try {
      const financialYear = uniqueFinancialYear(testContext.generateId());

      const first = await taApi.post<{ id: number }>(`/temples/${temple.id}/declarations`, declarationPayload(financialYear));
      testContext.registerEntityForCleanup('DECLARATION', first.id);

      const duplicateCreate = await taContext.post(resolveApiPath(`/temples/${temple.id}/declarations`), {
        headers: { 'Content-Type': 'application/json' },
        data: declarationPayload(financialYear),
      });
      expect(duplicateCreate.status()).toBe(409);
    } finally {
      await taApi.dispose();
      await taContext.dispose();
    }
  });

  test('should_reject_declaration_update_after_submission', async ({ temple, testContext }) => {
    const taApi = await createRoleApiClient(testContext.testRunId, 'TA');
    const taContext = await createAuthenticatedApiContext('TA');

    try {
      const create = await taApi.post<{ id: number }>(
        `/temples/${temple.id}/declarations`,
        declarationPayload(uniqueFinancialYear(testContext.generateId()))
      );
      testContext.registerEntityForCleanup('DECLARATION', create.id);

      await taApi.post(`/governance/declarations/${create.id}/submit`, {});

      const updateAfterSubmit = await taContext.put(resolveApiPath(`/declarations/${create.id}`), {
        headers: { 'Content-Type': 'application/json' },
        data: {
          ...declarationPayload(uniqueFinancialYear(testContext.generateId() + 10)),
          annualIncome: 9999,
        },
      });

      expect(updateAfterSubmit.status()).toBeGreaterThanOrEqual(400);
      expect(updateAfterSubmit.status()).not.toBe(200);
    } finally {
      await taApi.dispose();
      await taContext.dispose();
    }
  });

  test('should_validate_clarification_message_length', async ({ temple, testContext }) => {
    const taApi = await createRoleApiClient(testContext.testRunId, 'TA');
    const dcContext = await createAuthenticatedApiContext('DC');

    try {
      const declaration = await taApi.post<{ id: number }>(
        `/temples/${temple.id}/declarations`,
        declarationPayload(uniqueFinancialYear(testContext.generateId()))
      );
      testContext.registerEntityForCleanup('DECLARATION', declaration.id);

      await taApi.post(`/governance/declarations/${declaration.id}/submit`, {});

      const shortClarify = await dcContext.post(resolveApiPath(`/governance/declarations/${declaration.id}/clarify`), {
        headers: { 'Content-Type': 'application/json' },
        data: { message: 'short' },
      });
      expect(shortClarify.status()).toBe(400);
    } finally {
      await taApi.dispose();
      await dcContext.dispose();
    }
  });

  test('should_validate_future_financial_year_on_trust_financial_submission', async ({
    api,
    temple,
    testContext,
  }) => {
    const taContext = await createAuthenticatedApiContext('TA');

    try {
      const trust = await TrustFactory.create(api, testContext, { templeId: temple.id });

      const futureYearResponse = await taContext.post(resolveApiPath(`/trusts/${trust.id}/financials`), {
        headers: { 'Content-Type': 'application/json' },
        data: {
          financialYear: nextFinancialYear(),
          annualIncome: 10000,
          annualExpenditure: 5000,
        },
      });

      expect(futureYearResponse.status()).toBe(400);
    } finally {
      await taContext.dispose();
    }
  });
});
