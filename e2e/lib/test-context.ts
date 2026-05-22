import { DbClient } from './db-client';
import seedrandom from 'seedrandom';
import { env } from '../setup/env';

export type CleanupEntityType = 'DECLARATION' | 'TRUST' | 'TEMPLE';

interface CleanupRecord {
  entityType: CleanupEntityType;
  id: number;
}

export class TestContext {
  readonly testRunId: string;
  readonly rng: () => number;
  private cleanupEntities: CleanupRecord[] = [];

  constructor(testId: string) {
    const timestamp = Date.now();
    this.testRunId = `test_${testId.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
    this.rng = seedrandom(this.testRunId);
  }

  /**
   * Register a domain entity for cleanup after the test completes.
   * All linked workflow, notification, clarification and audit records
   * are cascade-deleted automatically in cleanup().
   */
  registerEntityForCleanup(entityType: CleanupEntityType, id: number): void {
    if (!id || id <= 0) {
      throw new Error(`registerEntityForCleanup: invalid id=${id} for entityType=${entityType}`);
    }
    this.cleanupEntities.push({ entityType, id });
  }

  /**
   * @deprecated Use registerEntityForCleanup(entityType, id) instead.
   * Kept as a no-op for call sites not yet migrated.
   */
  registerCleanup(_tableName: string): void {
    // no-op: use registerEntityForCleanup(entityType, id)
  }

  async cleanup(): Promise<void> {
    if (this.cleanupEntities.length === 0) {
      return;
    }

    const db = new DbClient(env.db);

    const summary: string[] = [];

    try {
      await db.connect();

      for (const { entityType, id } of this.cleanupEntities) {
        const entityTypeName = entityType;

        // Step 1: resolve workflow_instance_id for this entity
        const wiRow = await db.getOne<{ id: number }>(
          `SELECT id FROM workflow_instances WHERE entity_type = ? AND entity_id = ? LIMIT 1`,
          [entityTypeName, id]
        );
        const wiId = wiRow?.id ?? null;

        if (wiId) {
          // Step 2: delete entity_versions (references workflow_instance)
          const ev = await db.execute(
            `DELETE FROM entity_versions WHERE workflow_instance_id = ?`, [wiId]
          );
          if ((ev as any).affectedRows > 0) summary.push(`entity_versions(wi=${wiId}):${(ev as any).affectedRows}`);

          // Step 3: delete workflow_idempotency_records
          const wir = await db.execute(
            `DELETE FROM workflow_idempotency_records WHERE workflow_instance_id = ?`, [wiId]
          );
          if ((wir as any).affectedRows > 0) summary.push(`workflow_idempotency_records(wi=${wiId}):${(wir as any).affectedRows}`);

          // Step 4: delete clarification_messages via clarification_threads
          await db.execute(
            `DELETE cm FROM clarification_messages cm
             JOIN clarification_threads ct ON ct.id = cm.thread_id
             WHERE ct.workflow_instance_id = ?`,
            [wiId]
          );

          // Step 5: delete clarification_threads
          await db.execute(
            `DELETE FROM clarification_threads WHERE workflow_instance_id = ?`, [wiId]
          );

          // Step 6: delete in_app_notifications
          const ian = await db.execute(
            `DELETE FROM in_app_notifications WHERE workflow_instance_id = ?`, [wiId]
          );
          if ((ian as any).affectedRows > 0) summary.push(`in_app_notifications(wi=${wiId}):${(ian as any).affectedRows}`);

          // Step 7: delete notification_outbox
          const no = await db.execute(
            `DELETE FROM notification_outbox WHERE workflow_instance_id = ?`, [wiId]
          );
          if ((no as any).affectedRows > 0) summary.push(`notification_outbox(wi=${wiId}):${(no as any).affectedRows}`);

          // Step 8: delete governance_action_history
          const gah = await db.execute(
            `DELETE FROM governance_action_history WHERE workflow_instance_id = ?`, [wiId]
          );
          if ((gah as any).affectedRows > 0) summary.push(`governance_action_history(wi=${wiId}):${(gah as any).affectedRows}`);

          // Step 9: delete workflow_transitions
          const wt = await db.execute(
            `DELETE FROM workflow_transitions WHERE workflow_instance_id = ?`, [wiId]
          );
          if ((wt as any).affectedRows > 0) summary.push(`workflow_transitions(wi=${wiId}):${(wt as any).affectedRows}`);

          // Step 10: delete workflow_instance
          await db.execute(`DELETE FROM workflow_instances WHERE id = ?`, [wiId]);
          summary.push(`workflow_instances:${wiId}`);
        }

        // Step 11: entity-specific cleanup
        if (entityType === 'DECLARATION') {
          await db.execute(`DELETE FROM asset_declaration_versions WHERE declaration_id = ?`, [id]);
          await db.execute(`DELETE FROM declaration_clarifications WHERE declaration_id = ?`, [id]);
          // Also cleanup entity-level GAH rows not linked via workflow_instance_id
          await db.execute(
            `DELETE FROM governance_action_history WHERE entity_type = 'DECLARATION' AND entity_id = ? AND workflow_instance_id IS NULL`,
            [id]
          );
          const d = await db.execute(`DELETE FROM asset_declarations WHERE id = ?`, [id]);
          if ((d as any).affectedRows > 0) summary.push(`asset_declarations:${id}`);
        } else if (entityType === 'TRUST') {
          await db.execute(`DELETE FROM trust_financials WHERE trust_id = ?`, [id]);
          await db.execute(`DELETE FROM board_members WHERE trust_id = ?`, [id]);
          try {
            const t = await db.execute(`DELETE FROM trusts WHERE id = ?`, [id]);
            if ((t as any).affectedRows > 0) summary.push(`trusts:${id}`);
          } catch {
            // In shared environments, late FK writes can race cleanup.
            // Fall back to soft-delete so one-per-temple constraints remain clean.
            const tSoft = await db.execute(`UPDATE trusts SET is_deleted = 1 WHERE id = ?`, [id]);
            if ((tSoft as any).affectedRows > 0) summary.push(`trusts_soft_deleted:${id}`);
          }
        } else if (entityType === 'TEMPLE') {
          const t = await db.execute(
            `DELETE FROM temples WHERE id = ? AND name LIKE 'Test Temple%'`, [id]
          );
          if ((t as any).affectedRows > 0) summary.push(`temples:${id}`);
        }
      }

      // Global hygiene: remove orphan outbox rows that can be left behind by
      // interrupted runs and pollute consistency assertions across projects.
      const orphanOutbox = await db.execute(
        `DELETE o FROM notification_outbox o
         LEFT JOIN workflow_instances w ON w.id = o.workflow_instance_id
         WHERE o.workflow_instance_id IS NOT NULL
           AND w.id IS NULL`
      );
      if ((orphanOutbox as any).affectedRows > 0) {
        summary.push(`notification_outbox_orphans:${(orphanOutbox as any).affectedRows}`);
      }
    } finally {
      await db.disconnect();
    }

    if (summary.length > 0) {
      console.log(`[TestContext cleanup] testRunId=${this.testRunId} deleted: ${summary.join(', ')}`);
    }
  }

  generateId(): number {
    return Math.floor(this.rng() * 1000000) + 1;
  }
}
