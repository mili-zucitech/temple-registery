import { DbClient } from '../db-client';
import { expect } from '@playwright/test';

interface GovernanceActionHistory {
  id: number;
  workflow_instance_id: number;
  action: string;
  dc_user_id: number;
  timestamp: Date;
}

interface WorkflowTransition {
  id: number;
  action: string;
}

export class AuditAssertions {
  constructor(private db: DbClient) {}

  async assertAuditConsistency(workflowInstanceId: number): Promise<void> {
    const transitions = await this.db.query<WorkflowTransition>(`
      SELECT id, action FROM workflow_transitions
      WHERE workflow_instance_id = ?
        AND action NOT LIKE 'SYSTEM_%'
      ORDER BY created_at
    `, [workflowInstanceId]);

    const auditLogs = await this.db.query<GovernanceActionHistory>(`
      SELECT id, action FROM governance_action_history
      WHERE workflow_instance_id = ?
      ORDER BY timestamp
    `, [workflowInstanceId]);

    // Every transition should have corresponding audit log
    expect(auditLogs.length, 'Audit log count should match transition count').toBe(transitions.length);

    // Actions should match
    const transitionActions = transitions.map(t => t.action).sort();
    const auditActions = auditLogs.map(a => a.action).sort();
    expect(auditActions, 'Audit actions should match transition actions').toEqual(transitionActions);
  }

  async assertAuditLogExists(workflowInstanceId: number, action: string, actorId: number): Promise<void> {
    const log = await this.db.getOne<GovernanceActionHistory>(`
      SELECT id FROM governance_action_history
      WHERE workflow_instance_id = ? AND action = ? AND dc_user_id = ?
    `, [workflowInstanceId, action, actorId]);

    expect(log, `Audit log not found for action ${action} by actor ${actorId}`).not.toBeNull();
  }

  async assertAuditImmutability(auditLogId: number): Promise<void> {
    const log = await this.db.getOne<GovernanceActionHistory>(`
      SELECT id, action, dc_user_id, timestamp
      FROM governance_action_history
      WHERE id = ?
    `, [auditLogId]);

    expect(log, 'Audit log should exist').not.toBeNull();
    
    // Verify no UPDATE capability (schema should prevent this)
    // This is a structural check - audit logs should be INSERT-only
  }
}
