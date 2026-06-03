import { DbClient } from '../db-client';
import { expect } from '@playwright/test';

interface NotificationOutbox {
  id: number;
  workflow_instance_id: number;
  event_type: string;
  status: string;
}

interface InAppNotification {
  id: number;
  user_id: number;
  workflow_instance_id: number;
  is_read: boolean;
}

export class NotificationAssertions {
  constructor(private db: DbClient) {}

  async assertOutboxConsistency(): Promise<void> {
    // Check only workflows created in the last 24 hours to avoid pre-existing data issues.
    // Every recently-SUBMITTED workflow should have an outbox event.
    const missingOutbox = await this.db.query<{ id: number; entity_type: string; entity_id: number }>(`
      SELECT w.id, w.entity_type, w.entity_id
      FROM workflow_instances w
      WHERE w.status IN ('SUBMITTED', 'RESUBMITTED')
        AND w.created_at >= NOW() - INTERVAL 24 HOUR
        AND NOT EXISTS (
          SELECT 1 FROM notification_outbox o
          WHERE o.workflow_instance_id = w.id
            AND o.event_type = 'WORKFLOW_TRANSITION'
        )
    `);

    expect(missingOutbox, 'Found workflows without outbox events').toHaveLength(0);

    // No phantom outbox events (outbox without workflow) — scoped to recent data
    const phantomOutbox = await this.db.query<NotificationOutbox>(`
      SELECT o.id, o.workflow_instance_id
      FROM notification_outbox o
      WHERE o.event_type = 'WORKFLOW_TRANSITION'
        AND o.created_at >= NOW() - INTERVAL 24 HOUR
        AND NOT EXISTS (
          SELECT 1 FROM workflow_instances w
          WHERE w.id = o.workflow_instance_id
        )
    `);

    expect(phantomOutbox, 'Found phantom outbox events without workflow').toHaveLength(0);
  }

  async assertNotificationCreated(entityType: string, entityId: number): Promise<void> {
    const notifications = await this.db.query<InAppNotification>(`
      SELECT n.id
      FROM in_app_notifications n
      JOIN workflow_instances w ON w.id = n.workflow_instance_id
      WHERE w.entity_type = ? AND w.entity_id = ?
    `, [entityType, entityId]);

    expect(notifications.length, `No notifications found for ${entityType} ${entityId}`).toBeGreaterThan(0);
  }

  async assertNotificationSentToRecipient(recipientId: number, entityType: string, entityId: number): Promise<void> {
    const notification = await this.db.getOne<InAppNotification>(`
      SELECT n.id
      FROM in_app_notifications n
      JOIN workflow_instances w ON w.id = n.workflow_instance_id
      WHERE n.user_id = ? AND w.entity_type = ? AND w.entity_id = ?
    `, [recipientId, entityType, entityId]);

    expect(notification, `Notification not sent to recipient ${recipientId}`).not.toBeNull();
  }

  async assertNoDuplicateNotifications(): Promise<void> {
    const duplicates = await this.db.query<{ recipient_id: number; entity_type: string; entity_id: number; count: number }>(`
      SELECT user_id, workflow_instance_id, title, COUNT(*) as count
      FROM in_app_notifications
      GROUP BY user_id, workflow_instance_id, title, created_at
      HAVING COUNT(*) > 1
    `);

    expect(duplicates, 'Found duplicate notifications').toHaveLength(0);
  }
}
