import { test, expect } from '../fixtures/data.fixture';
import { createRoleApiClient } from '../lib/role-api-client';
import { createAuthenticatedApiContext, parseApiEnvelope, resolveApiPath } from '../lib/authenticated-request';

type NotificationItem = {
  id: number;
  referenceType?: string;
  referenceId?: number;
  workflowInstanceId?: number;
  read?: boolean;
};

type Paginated<T> = {
  content: T[];
  totalElements: number;
};

type TimelineEvent = {
  eventCode?: string;
  referenceId?: number;
};

function uniqueFinancialYear(seed: number): string {
  const start = 4200 + (seed % 4000);
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

function declarationPayload(financialYear: string) {
  return {
    financialYear,
    dueDate: '2026-03-31',
    annualIncome: 9000,
    annualExpenditure: 3000,
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

test.describe('Notification + Timeline Consistency', () => {
  test('should_create_notification_and_timeline_event_when_declaration_is_approved', async ({
    temple,
    testContext,
    db,
  }) => {
    const taApi = await createRoleApiClient(testContext.testRunId, 'TA');
    const dcApi = await createRoleApiClient(testContext.testRunId, 'DC');

    try {
      const created = await taApi.post<{ id: number }>(`/temples/${temple.id}/declarations`, declarationPayload(uniqueFinancialYear(testContext.generateId())));
      const declarationId = created.id;
      testContext.registerEntityForCleanup('DECLARATION', declarationId);

      await taApi.post(`/governance/declarations/${declarationId}/submit`, {});
      await dcApi.post(`/governance/declarations/${declarationId}/approve`, {
        remarks: 'Approval for notification and timeline assertions.',
      });

      const workflow = await db.getOne<{ id: number }>(
        `SELECT id FROM workflow_instances WHERE entity_type = 'DECLARATION' AND entity_id = ?`,
        [declarationId]
      );
      expect(workflow?.id).toBeTruthy();

      await expect
        .poll(async () => {
          const count = await db.getOne<{ total: number }>(
            'SELECT COUNT(*) AS total FROM in_app_notifications WHERE workflow_instance_id = ?',
            [workflow!.id]
          );
          return Number(count?.total ?? 0);
        })
        .toBeGreaterThan(0);

      let matchingNotification: NotificationItem | null = null;
      await expect
        .poll(async () => {
          const notificationList = await taApi.get<Paginated<NotificationItem>>('/notifications?page=0&size=100');
          matchingNotification = notificationList.content.find(
            (item) => Number(item.workflowInstanceId) === workflow!.id ||
              (item.referenceType === 'DECLARATION' && Number(item.referenceId) === declarationId)
          ) ?? null;
          return matchingNotification !== null;
        }, { timeout: 30_000 })
        .toBeTruthy();

      expect(matchingNotification).toBeDefined();

      await taApi.post(`/notifications/${matchingNotification!.id}/read`, {});
      const readRow = await db.getOne<{ is_read: number }>(
        'SELECT is_read FROM in_app_notifications WHERE id = ?',
        [matchingNotification!.id]
      );
      expect(Number(readRow?.is_read ?? 0)).toBe(1);

      const timeline = await taApi.get<Paginated<TimelineEvent>>(`/timeline/temples/${temple.id}?page=0&size=50`);
      const hasApprovalEvent = timeline.content.some(
        (item) => item.eventCode === 'DECLARATION_APPROVED' && Number(item.referenceId) === declarationId
      );
      expect(hasApprovalEvent).toBeTruthy();
    } finally {
      await taApi.dispose();
      await dcApi.dispose();
    }
  });

  test('should_block_ta_from_reading_non_owned_temple_timeline', async ({ temple, db }) => {
    const taContext = await createAuthenticatedApiContext('TA');

    try {
      const nonOwnedTemple = await db.getOne<{ id: number }>(
        'SELECT id FROM temples WHERE id <> ? ORDER BY id ASC LIMIT 1',
        [temple.id]
      );
      expect(nonOwnedTemple?.id).toBeTruthy();

      const timelineResponse = await taContext.get(resolveApiPath(`/timeline/temples/${nonOwnedTemple!.id}?page=0&size=10`));
      expect(timelineResponse.status()).toBe(403);
    } finally {
      await taContext.dispose();
    }
  });

  test('should_clamp_timeline_page_size_to_max_50', async ({ temple }) => {
    const taContext = await createAuthenticatedApiContext('TA');

    try {
      const response = await taContext.get(resolveApiPath(`/timeline/temples/${temple.id}?page=0&size=500`));
      expect(response.status()).toBe(200);

      const envelope = await parseApiEnvelope<Paginated<TimelineEvent>>(response);
      expect(envelope.success).toBeTruthy();
      expect(envelope.data?.content.length ?? 0).toBeLessThanOrEqual(50);
    } finally {
      await taContext.dispose();
    }
  });
});
