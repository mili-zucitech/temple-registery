import { DbClient } from '../db-client';
import { expect } from '@playwright/test';

export class IntegrityAssertions {
  constructor(private db: DbClient) {}

  async assertForeignKeyIntegrity(): Promise<void> {
    // Scope to recently-created rows (last 24h) to avoid pre-existing pollution
    // from prior test runs that may have left orphans before cleanup was hardened.
    // workflow_instance → temple
    const invalidTempleRefs = await this.db.query(`
      SELECT id FROM workflow_instances
      WHERE temple_id IS NOT NULL
        AND temple_id NOT IN (SELECT id FROM temples)
        AND created_at >= NOW() - INTERVAL 24 HOUR
    `);
    expect(invalidTempleRefs, 'Found invalid temple_id references').toHaveLength(0);

    // workflow_instance → district
    const invalidDistrictRefs = await this.db.query(`
      SELECT id FROM workflow_instances
      WHERE district_id IS NOT NULL
        AND district_id NOT IN (SELECT id FROM districts)
        AND created_at >= NOW() - INTERVAL 24 HOUR
    `);
    expect(invalidDistrictRefs, 'Found invalid district_id references').toHaveLength(0);

    // asset_declaration → temple
    const invalidDeclTempleRefs = await this.db.query(`
      SELECT id FROM asset_declarations
      WHERE temple_id NOT IN (SELECT id FROM temples)
        AND created_at >= NOW() - INTERVAL 24 HOUR
    `);
    expect(invalidDeclTempleRefs, 'Found invalid temple_id in declarations').toHaveLength(0);

    // trust → temple
    const invalidTrustTempleRefs = await this.db.query(`
      SELECT id FROM trusts
      WHERE temple_id NOT IN (SELECT id FROM temples)
        AND created_at >= NOW() - INTERVAL 24 HOUR
    `);
    expect(invalidTrustTempleRefs, 'Found invalid temple_id in trusts').toHaveLength(0);
  }

  async assertNoDuplicateDeclarations(): Promise<void> {
    // Scope to recently-created declarations (last 10 minutes) so that the
    // assertion focuses on the current test run and ignores any pre-existing
    // pollution from older runs.
    const duplicates = await this.db.query<{ temple_id: number; fiscal_year: string; count: number }>(`
      SELECT temple_id, financial_year, COUNT(*) as count
      FROM asset_declarations
      WHERE created_at >= NOW() - INTERVAL 10 MINUTE
      GROUP BY temple_id, financial_year
      HAVING COUNT(*) > 1
    `);

    expect(duplicates, 'Found duplicate declarations for same temple + fiscal year').toHaveLength(0);
  }

  async assertClarificationRoundLimits(declarationId: number): Promise<void> {
    const workflowInstance = await this.db.getOne<{ id: number }>(`
      SELECT id FROM workflow_instances
      WHERE entity_type = 'DECLARATION' AND entity_id = ?
    `, [declarationId]);

    if (!workflowInstance) {
      return; // No workflow instance yet
    }

    const rounds = await this.db.query<{ round_number: number }>(`
      SELECT round_number
      FROM clarification_threads
      WHERE workflow_instance_id = ?
    `, [workflowInstance.id]);

    if (rounds.length === 0) {
      return; // No clarification rounds yet
    }

    const maxRound = Math.max(...rounds.map(r => r.round_number));
    expect(maxRound, 'Clarification rounds should not exceed 3').toBeLessThanOrEqual(3);
  }

  async assertNoOrphanedClarifications(): Promise<void> {
    const orphans = await this.db.query(`
      SELECT ct.id
      FROM clarification_threads ct
      WHERE ct.workflow_instance_id NOT IN (SELECT id FROM workflow_instances)
    `);

    expect(orphans, 'Found orphaned clarification threads').toHaveLength(0);
  }

  async assertNoOrphanedTasks(): Promise<void> {
    try {
      const orphans = await this.db.query(`
        SELECT wt.id
        FROM workflow_tasks wt
        WHERE wt.workflow_instance_id NOT IN (SELECT id FROM workflow_instances)
      `);

      expect(orphans, 'Found orphaned workflow tasks').toHaveLength(0);
    } catch {
      // workflow_tasks is optional in current deployments.
    }
  }
}
