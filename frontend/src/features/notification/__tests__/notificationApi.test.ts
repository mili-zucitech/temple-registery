/**
 * Static verification tests for notificationApi.ts.
 *
 * RTK Query does not expose tagTypes or invalidatesTags at runtime on
 * the public API, so we inspect the source file directly — the same
 * approach used in declarationApi.cache.test.ts.
 *
 * Covers:
 *   - tagTypes declares 'Notification' and 'NotificationPreference'
 *   - Query endpoints use providesTags
 *   - Mutation endpoints invalidate 'Notification' or 'NotificationPreference'
 *   - All expected endpoint hooks are exported
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const SOURCE_PATH = join(__dirname, '../notificationApi.ts')

function src(): string {
  return readFileSync(SOURCE_PATH, 'utf-8')
}

function sliceEndpoint(source: string, endpointName: string, marker: string): string | null {
  const idx = source.indexOf(`${endpointName}: builder.${marker}`)
  if (idx === -1) return null
  return source.slice(idx, idx + 800)
}

function extractField(block: string, field: string): string | null {
  const idx = block.indexOf(`${field}:`)
  if (idx === -1) return null
  const from = block.slice(idx)
  const lineEnd = from.indexOf('\n')
  return (lineEnd === -1 ? from : from.slice(0, lineEnd)).slice(field.length + 1).trim()
}

// ─── tagTypes ─────────────────────────────────────────────────────────────────

describe('notificationApi — tagTypes', () => {
  it('should_declareNotificationTag', () => {
    expect(src()).toContain("'Notification'")
  })

  it('should_declareNotificationPreferenceTag', () => {
    expect(src()).toContain("'NotificationPreference'")
  })
})

// ─── Query endpoints — providesTags ───────────────────────────────────────────

describe('notificationApi — query providesTags', () => {
  it('should_listNotifications_provide_Notification_tag', () => {
    const block = sliceEndpoint(src(), 'listNotifications', 'query')
    expect(block).not.toBeNull()
    expect(block).toContain('providesTags')
    expect(block).toContain("'Notification'")
  })

  it('should_getUnreadCount_provide_Notification_tag', () => {
    const block = sliceEndpoint(src(), 'getUnreadCount', 'query')
    expect(block).not.toBeNull()
    expect(block).toContain('providesTags')
    expect(block).toContain("'Notification'")
  })

  it('should_getPreferences_provide_NotificationPreference_tag', () => {
    const block = sliceEndpoint(src(), 'getPreferences', 'query')
    expect(block).not.toBeNull()
    expect(block).toContain('providesTags')
    expect(block).toContain("'NotificationPreference'")
  })
})

// ─── Mutation endpoints — invalidatesTags ─────────────────────────────────────

describe('notificationApi — mutation invalidatesTags', () => {
  it('should_markRead_invalidate_Notification_tag', () => {
    const block = sliceEndpoint(src(), 'markRead', 'mutation')
    expect(block).not.toBeNull()
    expect(block).toContain('invalidatesTags')
    expect(block).toContain("'Notification'")
  })

  it('should_markAllRead_invalidate_Notification_tag', () => {
    const block = sliceEndpoint(src(), 'markAllRead', 'mutation')
    expect(block).not.toBeNull()
    expect(block).toContain('invalidatesTags')
    expect(block).toContain("'Notification'")
  })

  it('should_deleteNotification_invalidate_Notification_tag', () => {
    const block = sliceEndpoint(src(), 'deleteNotification', 'mutation')
    expect(block).not.toBeNull()
    expect(block).toContain('invalidatesTags')
    expect(block).toContain("'Notification'")
  })

  it('should_clearAllNotifications_invalidate_Notification_tag', () => {
    const block = sliceEndpoint(src(), 'clearAllNotifications', 'mutation')
    expect(block).not.toBeNull()
    expect(block).toContain('invalidatesTags')
    expect(block).toContain("'Notification'")
  })

  it('should_updatePreferences_invalidate_NotificationPreference_tag', () => {
    const block = sliceEndpoint(src(), 'updatePreferences', 'mutation')
    expect(block).not.toBeNull()
    expect(block).toContain('invalidatesTags')
    expect(block).toContain("'NotificationPreference'")
  })
})

// ─── Delete endpoints use DELETE method ────────────────────────────────────────

describe('notificationApi — delete endpoint methods', () => {
  it('should_deleteNotification_use_DELETE_method', () => {
    const block = sliceEndpoint(src(), 'deleteNotification', 'mutation')
    expect(block).not.toBeNull()
    expect(block).toContain("method: 'DELETE'")
  })

  it('should_clearAllNotifications_use_DELETE_method', () => {
    const block = sliceEndpoint(src(), 'clearAllNotifications', 'mutation')
    expect(block).not.toBeNull()
    expect(block).toContain("method: 'DELETE'")
  })
})

// ─── Exported hooks ───────────────────────────────────────────────────────────

describe('notificationApi — exported hooks', () => {
  const EXPECTED_HOOKS = [
    'useListNotificationsQuery',
    'useGetUnreadCountQuery',
    'useMarkReadMutation',
    'useMarkAllReadMutation',
    'useDeleteNotificationMutation',
    'useClearAllNotificationsMutation',
    'useGetPreferencesQuery',
    'useUpdatePreferencesMutation',
  ]

  for (const hook of EXPECTED_HOOKS) {
    it(`should_export_${hook}`, () => {
      expect(src()).toContain(hook)
    })
  }
})

// ─── Rich context fields in NotificationResponse ─────────────────────────────

describe('notificationApi — NotificationResponse rich fields', () => {
  const EXPECTED_FIELDS = [
    'notificationType',
    'redirectUrl',
    'templeId',
    'templeName',
    'actionByName',
    'actionByRole',
    'workflowStatus',
  ]

  it('should_define_all_rich_context_fields', () => {
    const source = src()
    for (const field of EXPECTED_FIELDS) {
      expect(source, `NotificationResponse missing field: ${field}`).toContain(field)
    }
  })
})

// ─── ModuleType completeness ──────────────────────────────────────────────────

describe('notificationApi — ModuleType', () => {
  const EXPECTED_MODULE_TYPES = [
    'TEMPLE', 'TRUST', 'EMPLOYEE', 'CONTRACTOR',
    'DECLARATION', 'DOCUMENT', 'FINANCE', 'SYSTEM',
  ]

  it('should_define_all_module_types', () => {
    const source = src()
    for (const type of EXPECTED_MODULE_TYPES) {
      expect(source, `ModuleType missing: ${type}`).toContain(`'${type}'`)
    }
  })
})
