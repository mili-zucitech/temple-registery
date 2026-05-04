import { test, expect } from '../fixtures/data.fixture';
import { DeclarationFactory } from '../factories/DeclarationFactory';
import { TrustFactory } from '../factories/TrustFactory';

test.describe('Data Integrity', () => {
  test('should_maintain_referential_integrity_when_entities_created', async ({
    api,
    testContext,
    temple,
    dbAssert
  }) => {
    // Create declaration
    const declaration = await DeclarationFactory.create(api, testContext, { templeId: temple.id });
    
    // Create trust
    const trust = await TrustFactory.create(api, testContext, { templeId: temple.id });
    
    // Verify no orphaned workflows
    await dbAssert.workflow.assertNoOrphanedWorkflows();
    
    // Verify no duplicate workflows
    await dbAssert.workflow.assertNoDuplicateWorkflows();
    
    // Verify FK integrity
    await dbAssert.integrity.assertForeignKeyIntegrity();
  });

  test('should_prevent_duplicate_declaration_when_same_temple_and_year', async ({
    api,
    testContext,
    temple,
    dbAssert
  }) => {
    // Create first declaration
    await DeclarationFactory.create(api, testContext, {
      templeId: temple.id,
      fiscalYear: '2025-26'
    });
    
    // Try to create duplicate
    try {
      await DeclarationFactory.create(api, testContext, {
        templeId: temple.id,
        fiscalYear: '2025-26'
      });
      
      throw new Error('Should have prevented duplicate declaration');
    } catch (error: any) {
      expect(error.message).toContain('409');
    }
    
    // Verify no duplicates in DB
    await dbAssert.integrity.assertNoDuplicateDeclarations();
  });

  test('should_enforce_clarification_round_limits_when_max_reached', async ({
    api,
    testContext,
    temple,
    db,
    dbAssert
  }) => {
    // Create and submit declaration
    const declaration = await DeclarationFactory.createAndSubmit(api, testContext, { templeId: temple.id });
    
    // Get workflow instance
    const workflowInstance = await db.getOne<{ id: number }>(`
      SELECT id FROM workflow_instance
      WHERE entity_type = 'DECLARATION' AND entity_id = ?
    `, [declaration.id]);
    
    // Request clarification 3 times (max limit)
    for (let i = 1; i <= 3; i++) {
      await api.post(`/workflow/${workflowInstance!.id}/request-clarification`, {
        message: `Clarification round ${i}`
      });
      
      // Respond to clarification
      await api.post(`/workflow/${workflowInstance!.id}/respond-clarification`, {
        message: `Response to round ${i}`
      });
    }
    
    // Verify round limits
    await dbAssert.integrity.assertClarificationRoundLimits(declaration.id);
    
    // Try to request 4th clarification (should fail or escalate)
    try {
      await api.post(`/workflow/${workflowInstance!.id}/request-clarification`, {
        message: 'Clarification round 4'
      });
      
      // If it succeeds, it should be escalated
      const clarificationThreads = await db.query<{ round_number: number; escalation_level: number }>(`
        SELECT round_number, escalation_level
        FROM clarification_thread
        WHERE workflow_instance_id = ?
      `, [workflowInstance!.id]);
      
      const round4 = clarificationThreads.find(t => t.round_number === 4);
      if (round4) {
        expect(round4.escalation_level).toBeGreaterThan(0);
      }
    } catch (error: any) {
      // Expected to fail
      expect(error.message).toContain('Maximum clarification rounds exceeded');
    }
  });

  test('should_maintain_audit_trail_consistency_when_workflow_transitions', async ({
    api,
    testContext,
    temple,
    db,
    dbAssert
  }) => {
    // Create and submit declaration
    const declaration = await DeclarationFactory.createAndSubmit(api, testContext, { templeId: temple.id });
    
    // Get workflow instance
    const workflowInstance = await db.getOne<{ id: number }>(`
      SELECT id FROM workflow_instance
      WHERE entity_type = 'DECLARATION' AND entity_id = ?
    `, [declaration.id]);
    
    // Approve declaration
    await api.post(`/workflow/${workflowInstance!.id}/approve`, {
      comment: 'Approved'
    });
    
    // Verify audit consistency
    await dbAssert.audit.assertAuditConsistency(workflowInstance!.id);
    
    // Verify transition ordering
    await dbAssert.workflow.assertValidTransitionOrdering(workflowInstance!.id);
  });

  test('should_maintain_notification_consistency_when_events_published', async ({
    api,
    testContext,
    temple,
    dbAssert
  }) => {
    // Create and submit declaration
    await DeclarationFactory.createAndSubmit(api, testContext, { templeId: temple.id });
    
    // Verify outbox consistency
    await dbAssert.notification.assertOutboxConsistency();
    
    // Verify no duplicate notifications
    await dbAssert.notification.assertNoDuplicateNotifications();
  });
});
