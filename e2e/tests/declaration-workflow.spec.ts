import { test, expect } from '../fixtures/data.fixture';

function buildUniqueFinancialYear(seed: number): string {
  const start = 1000 + (seed % 8000);
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

function toCookieJar(setCookieHeader: string | null): string {
  if (!setCookieHeader) return '';
  return setCookieHeader
    .split(/,(?=[^;]+=)/)
    .map((part) => part.split(';')[0].trim())
    .join('; ');
}

async function loginAndGetCookie(username: string, password: string): Promise<string> {
  const response = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(`Role login failed for ${username}: ${response.status}`);
  }

  return toCookieJar(response.headers.get('set-cookie'));
}

async function dcAction(path: string, body: Record<string, unknown>): Promise<void> {
  const cookie = await loginAndGetCookie('dc_mysuru', 'password123');
  const response = await fetch(`http://localhost:8080/api/v1${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`DC action failed ${path}: ${response.status} - ${await response.text()}`);
  }
}

async function taCreateAndSubmitDeclaration(
  templeId: number,
  financialYear: string,
  testRunId: string,
): Promise<number> {
  const cookie = await loginAndGetCookie('ta_chamundi', 'password123');

  const createResponse = await fetch(`http://localhost:8080/api/v1/temples/${templeId}/declarations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      financialYear,
      dueDate: '2026-03-31',
      annualIncome: 0,
      annualExpenditure: 0,
      test_run_id: testRunId,
    }),
  });

  if (!createResponse.ok) {
    throw new Error(`TA create declaration failed: ${createResponse.status} - ${await createResponse.text()}`);
  }

  const createBody = await createResponse.json() as any;
  const declarationId = Number(createBody?.data?.id);
  if (!declarationId) {
    throw new Error('TA create declaration did not return a declaration id.');
  }

  const submitResponse = await fetch(`http://localhost:8080/api/v1/governance/declarations/${declarationId}/submit`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });

  if (!submitResponse.ok) {
    throw new Error(`TA submit declaration failed: ${submitResponse.status} - ${await submitResponse.text()}`);
  }

  return declarationId;
}

test.describe('Declaration Workflow', () => {
  test('should_complete_full_workflow_when_ta_submits_and_dc_approves', async ({
    api,
    testContext,
    temple,
    db,
    dbAssert
  }) => {
    const financialYear = buildUniqueFinancialYear(testContext.generateId());

    // TA creates and submits declaration via TA-authenticated API to preserve audit parity.
    const declarationId = await taCreateAndSubmitDeclaration(
      temple.id,
      financialYear,
      testContext.testRunId,
    );
    testContext.registerEntityForCleanup('DECLARATION', declarationId);
    expect(declarationId).toBeGreaterThan(0);
    
    // Verify workflow instance created
    const workflowInstance = await db.getOne<{ id: number; status: string }>(`
      SELECT id, status FROM workflow_instances
      WHERE entity_type = 'DECLARATION' AND entity_id = ?
    `, [declarationId]);
    
    expect(workflowInstance).not.toBeNull();
    expect(workflowInstance!.status).toBe('SUBMITTED');
    
    // DC approves declaration
    await dcAction(`/governance/declarations/${declarationId}/approve`, {
      remarks: 'Approved after review'
    });
    
    // Verify workflow status updated
    await dbAssert.workflow.assertWorkflowStatus('DECLARATION', declarationId, 'APPROVED');
    
    // Verify transition ordering
    await dbAssert.workflow.assertValidTransitionOrdering(workflowInstance!.id);
    
    // Verify audit trail
    await dbAssert.audit.assertAuditConsistency(workflowInstance!.id);
    
    // Verify notification sent
    await dbAssert.notification.assertNotificationCreated('DECLARATION', declarationId);
  });

  test('should_reject_declaration_when_dc_rejects', async ({
    api,
    testContext,
    temple,
    dbAssert
  }) => {
    const financialYear = buildUniqueFinancialYear(testContext.generateId());

    // Create and submit declaration via API
    const declaration = await api.post(`/temples/${temple.id}/declarations`, {
      financialYear,
      dueDate: '2026-03-31',
      annualIncome: 0,
      annualExpenditure: 0,
      test_run_id: testContext.testRunId
    });
    
    await api.post(`/governance/declarations/${declaration.id}/submit`, {});
    testContext.registerEntityForCleanup('DECLARATION', declaration.id);
    
    // DC rejects
    await dcAction(`/governance/declarations/${declaration.id}/reject`, {
      remarks: 'Incomplete information in declaration details'
    });
    
    // Verify status
    await dbAssert.workflow.assertWorkflowStatus('DECLARATION', declaration.id, 'REJECTED');
  });

  test('should_handle_clarification_round_when_dc_requests_info', async ({
    api,
    testContext,
    temple,
    db,
    dbAssert
  }) => {
    const financialYear = buildUniqueFinancialYear(testContext.generateId());

    // Create and submit declaration
    const declaration = await api.post(`/temples/${temple.id}/declarations`, {
      financialYear,
      dueDate: '2026-03-31',
      annualIncome: 0,
      annualExpenditure: 0,
      test_run_id: testContext.testRunId
    });
    
    await api.post(`/governance/declarations/${declaration.id}/submit`, {});
    testContext.registerEntityForCleanup('DECLARATION', declaration.id);
    
    // DC requests clarification
    await dcAction(`/governance/declarations/${declaration.id}/clarify`, {
      message: 'Please provide survey documents for the listed assets'
    });
    
    // Verify clarification thread created
    const workflowInstance = await db.getOne<{ id: number }>(`
      SELECT id FROM workflow_instances
      WHERE entity_type = 'DECLARATION' AND entity_id = ?
    `, [declaration.id]);
    
    const clarificationThread = await db.getOne<{ id: number; round_number: number }>(`
      SELECT id, round_number FROM clarification_threads
      WHERE workflow_instance_id = ?
    `, [workflowInstance!.id]);
    
    expect(clarificationThread).not.toBeNull();
    expect(clarificationThread!.round_number).toBe(1);
    
    // Verify workflow status
    await dbAssert.workflow.assertWorkflowStatus('DECLARATION', declaration.id, 'CLARIFICATION_REQUESTED');
  });
});
