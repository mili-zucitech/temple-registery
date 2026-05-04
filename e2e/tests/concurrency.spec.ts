import { test, expect } from '../fixtures/data.fixture';
import { DeclarationFactory } from '../factories/DeclarationFactory';

test.describe('Concurrency Control', () => {
  test('should_prevent_duplicate_submit_when_double_clicked', async ({
    api,
    testContext,
    temple,
    db,
    dbAssert
  }) => {
    // Create declaration
    const declaration = await DeclarationFactory.create(api, testContext, { templeId: temple.id });
    
    // Attempt duplicate submit
    const submitPromises = [
      api.post(`/declarations/${declaration.id}/submit`, {}),
      api.post(`/declarations/${declaration.id}/submit`, {})
    ];
    
    const results = await Promise.allSettled(submitPromises);
    
    // One should succeed, one should fail
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    expect(succeeded).toBe(1);
    expect(failed).toBe(1);
    
    // Verify only one workflow transition created
    const workflowInstance = await db.getOne<{ id: number }>(`
      SELECT id FROM workflow_instance
      WHERE entity_type = 'DECLARATION' AND entity_id = ?
    `, [declaration.id]);
    
    await dbAssert.workflow.assertTransitionCount(workflowInstance!.id, 1);
  });

  test('should_prevent_concurrent_approval_when_two_dcs_approve', async ({
    api,
    testContext,
    temple,
    db,
    dbAssert
  }) => {
    // Create and submit declaration
    const declaration = await DeclarationFactory.createAndSubmit(api, testContext, { templeId: temple.id });
    
    // Get workflow instance
    const workflowInstance = await db.getOne<{ id: number; version: number }>(`
      SELECT id, version FROM workflow_instance
      WHERE entity_type = 'DECLARATION' AND entity_id = ?
    `, [declaration.id]);
    
    // Two DCs try to approve simultaneously
    const approvePromises = [
      api.post(`/workflow/${workflowInstance!.id}/approve`, {
        expectedVersion: workflowInstance!.version,
        comment: 'Approved by DC1'
      }),
      api.post(`/workflow/${workflowInstance!.id}/approve`, {
        expectedVersion: workflowInstance!.version,
        comment: 'Approved by DC2'
      })
    ];
    
    const results = await Promise.allSettled(approvePromises);
    
    // One should succeed, one should fail with optimistic lock exception
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    expect(succeeded).toBe(1);
    expect(failed).toBe(1);
    
    // Verify only one APPROVE transition
    const transitions = await db.query<{ action: string }>(`
      SELECT action FROM workflow_transition
      WHERE workflow_instance_id = ? AND action = 'APPROVE'
    `, [workflowInstance!.id]);
    
    expect(transitions).toHaveLength(1);
  });

  test('should_handle_stale_version_when_entity_updated_concurrently', async ({
    api,
    testContext,
    temple,
    db
  }) => {
    // Create trust
    const trust = await api.post('/trusts', {
      templeId: temple.id,
      trustName: 'Test Trust',
      trustRegistrationNumber: 'TRN-001',
      panNumber: 'ABCDE1234F',
      test_run_id: testContext.testRunId
    });
    testContext.registerCleanup('trust');
    
    // Get current version
    const currentTrust = await db.getOne<{ governance_version: number }>(`
      SELECT governance_version FROM trust WHERE id = ?
    `, [trust.id]);
    
    // Update trust (increments version)
    await api.put(`/trusts/${trust.id}`, {
      trustName: 'Updated Trust Name'
    });
    
    // Try to update with stale version
    try {
      await api.put(`/trusts/${trust.id}`, {
        trustName: 'Another Update',
        expectedVersion: currentTrust!.governance_version
      });
      
      throw new Error('Should have thrown optimistic lock exception');
    } catch (error: any) {
      expect(error.message).toContain('409');
    }
  });

  test('should_rollback_transaction_when_workflow_transition_fails', async ({
    api,
    testContext,
    temple,
    db,
    dbAssert
  }) => {
    // Create declaration
    const declaration = await DeclarationFactory.create(api, testContext, { templeId: temple.id });
    
    // Submit declaration
    await api.post(`/declarations/${declaration.id}/submit`, {});
    
    // Get workflow instance
    const workflowInstance = await db.getOne<{ id: number }>(`
      SELECT id FROM workflow_instance
      WHERE entity_type = 'DECLARATION' AND entity_id = ?
    `, [declaration.id]);
    
    // Simulate invalid transition (try to approve without review)
    try {
      await api.post(`/workflow/${workflowInstance!.id}/invalid-action`, {});
    } catch (error) {
      // Expected to fail
    }
    
    // Verify no partial data persisted
    await dbAssert.workflow.assertNoOrphanedWorkflows();
    await dbAssert.integrity.assertForeignKeyIntegrity();
  });
});
