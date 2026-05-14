import { DbClient } from '../db-client';
import { expect } from '@playwright/test';

interface WorkflowInstance {
  id: number;
  entity_type: string;
  entity_id: number;
  status: string;
  version: number;
}

interface WorkflowTransition {
  id: number;
  workflow_instance_id: number;
  action: string;
  from_status: string;
  to_status: string;
  created_at: Date;
}

export class WorkflowAssertions {
  constructor(private db: DbClient) {}

  async assertNoOrphanedWorkflows(): Promise<void> {
    const orphans = await this.db.query<WorkflowInstance>(`
      SELECT w.id, w.entity_type, w.entity_id
      FROM workflow_instances w
      WHERE w.created_at >= NOW() - INTERVAL 1 HOUR
        AND (
          (w.entity_type = 'TRUST' AND w.entity_id NOT IN (SELECT id FROM trusts))
          OR (w.entity_type = 'DECLARATION' AND w.entity_id NOT IN (SELECT id FROM asset_declarations))
          OR (w.entity_type = 'TEMPLE_PROFILE' AND w.entity_id NOT IN (SELECT id FROM temple_profile_staging))
        )
    `);

    expect(orphans, 'Found orphaned workflow instances').toHaveLength(0);
  }

  async assertNoDuplicateWorkflows(): Promise<void> {
    const duplicates = await this.db.query<{ entity_type: string; entity_id: number; count: number }>(`
      SELECT entity_type, entity_id, COUNT(*) as count
      FROM workflow_instances
      GROUP BY entity_type, entity_id
      HAVING COUNT(*) > 1
    `);

    expect(duplicates, 'Found duplicate workflow instances for same entity').toHaveLength(0);
  }

  async assertValidTransitionOrdering(workflowInstanceId: number): Promise<void> {
    const transitions = await this.db.query<WorkflowTransition>(`
      SELECT id, workflow_instance_id, action, from_status, to_status, created_at
      FROM workflow_transitions
      WHERE workflow_instance_id = ?
      ORDER BY created_at
    `, [workflowInstanceId]);

    if (transitions.length === 0) {
      return; // No transitions yet
    }

    // Verify chronological order
    for (let i = 1; i < transitions.length; i++) {
      const prevTime = new Date(transitions[i - 1].created_at).getTime();
      const currTime = new Date(transitions[i].created_at).getTime();
      expect(currTime, `Transition ${i} timestamp should be >= previous`).toBeGreaterThanOrEqual(prevTime);
    }

    // Verify logical order: SUBMIT must come before APPROVE/REJECT
    const actions = transitions.map(t => t.action);
    const submitIndex = actions.indexOf('SUBMIT');
    const approveIndex = actions.indexOf('APPROVE');
    const rejectIndex = actions.indexOf('REJECT');

    if (approveIndex !== -1 && submitIndex !== -1) {
      expect(submitIndex, 'SUBMIT must come before APPROVE').toBeLessThan(approveIndex);
    }

    if (rejectIndex !== -1 && submitIndex !== -1) {
      expect(submitIndex, 'SUBMIT must come before REJECT').toBeLessThan(rejectIndex);
    }
  }

  async assertWorkflowStatus(entityType: string, entityId: number, expectedStatus: string): Promise<void> {
    const instance = await this.db.getOne<WorkflowInstance>(`
      SELECT * FROM workflow_instances
      WHERE entity_type = ? AND entity_id = ?
    `, [entityType, entityId]);

    expect(instance, `Workflow instance not found for ${entityType} ${entityId}`).not.toBeNull();
    expect(instance!.status, `Workflow status mismatch`).toBe(expectedStatus);
  }

  async assertVersionConsistency(entityType: string, entityId: number): Promise<void> {
    const workflowInstance = await this.db.getOne<WorkflowInstance>(`
      SELECT version FROM workflow_instances
      WHERE entity_type = ? AND entity_id = ?
    `, [entityType, entityId]);

    if (!workflowInstance) {
      throw new Error(`Workflow instance not found for ${entityType} ${entityId}`);
    }

    let entityVersion: number | null = null;

    switch (entityType) {
      case 'TRUST': {
        const trust = await this.db.getOne<{ governance_version: number }>(`
          SELECT governance_version FROM trusts WHERE id = ?
        `, [entityId]);
        entityVersion = trust?.governance_version ?? null;
        break;
      }
      case 'DECLARATION': {
        const declaration = await this.db.getOne<{ governance_version: number }>(`
          SELECT governance_version FROM asset_declarations WHERE id = ?
        `, [entityId]);
        entityVersion = declaration?.governance_version ?? null;
        break;
      }
      default:
        // Skip version check for entities without version column
        return;
    }

    if (entityVersion !== null) {
      expect(entityVersion, 'Entity version should match workflow version').toBe(workflowInstance.version);
    }
  }

  async assertTransitionCount(workflowInstanceId: number, expectedCount: number): Promise<void> {
    const transitions = await this.db.query<WorkflowTransition>(`
      SELECT id FROM workflow_transitions
      WHERE workflow_instance_id = ?
    `, [workflowInstanceId]);

    expect(transitions, `Expected ${expectedCount} transitions`).toHaveLength(expectedCount);
  }
}
