/**
 * Static verification tests for accessControlApi.ts.
 *
 * RTK Query does not expose tagTypes or invalidatesTags at runtime on the
 * public API, so we inspect the source file directly — the same approach
 * used in notificationApi.test.ts and declarationApi.cache.test.ts.
 *
 * Covers:
 *   - tagTypes declares all four cache tags
 *   - Every mutation invalidates 'Policy' and 'MyPermissions'
 *   - batchUpsertPolicies wraps the body in { updates: [...{ policy }] }
 *   - All generated hooks are exported
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const SOURCE_PATH = join(__dirname, '../accessControlApi.ts')

function src(): string {
  return readFileSync(SOURCE_PATH, 'utf-8')
}

function sliceEndpoint(source: string, endpointName: string, marker: 'query' | 'mutation'): string | null {
  const idx = source.indexOf(`${endpointName}: builder.${marker}`)
  if (idx === -1) return null
  return source.slice(idx, idx + 500)
}

// ─── tagTypes ─────────────────────────────────────────────────────────────────

describe('accessControlApi — tagTypes', () => {
  it('should_declare_Policy_tag', () => {
    expect(src()).toContain("'Policy'")
  })

  it('should_declare_FieldMask_tag', () => {
    expect(src()).toContain("'FieldMask'")
  })

  it('should_declare_MyPermissions_tag', () => {
    expect(src()).toContain("'MyPermissions'")
  })

  it('should_declare_PolicyAudit_tag', () => {
    expect(src()).toContain("'PolicyAudit'")
  })
})

// ─── Query endpoints — providesTags ───────────────────────────────────────────

describe('accessControlApi — query providesTags', () => {
  it('should_getMyPermissions_provide_MyPermissions_tag', () => {
    const block = sliceEndpoint(src(), 'getMyPermissions', 'query')
    expect(block).not.toBeNull()
    expect(block).toContain('providesTags')
    expect(block).toContain("'MyPermissions'")
  })

  it('should_listPolicies_provide_Policy_tag', () => {
    const block = sliceEndpoint(src(), 'listPolicies', 'query')
    expect(block).not.toBeNull()
    expect(block).toContain('providesTags')
    expect(block).toContain("'Policy'")
  })

  it('should_getPolicyMatrix_provide_Policy_tag', () => {
    const block = sliceEndpoint(src(), 'getPolicyMatrix', 'query')
    expect(block).not.toBeNull()
    expect(block).toContain('providesTags')
    expect(block).toContain("'Policy'")
  })
})

// ─── Mutation endpoints — invalidatesTags ─────────────────────────────────────

describe('accessControlApi — mutation invalidatesTags', () => {
  it('should_createPolicy_invalidate_Policy_and_MyPermissions', () => {
    const block = sliceEndpoint(src(), 'createPolicy', 'mutation')
    expect(block).not.toBeNull()
    expect(block).toContain('invalidatesTags')
    expect(block).toContain("'Policy'")
    expect(block).toContain("'MyPermissions'")
  })

  it('should_updatePolicy_invalidate_Policy_and_MyPermissions', () => {
    const block = sliceEndpoint(src(), 'updatePolicy', 'mutation')
    expect(block).not.toBeNull()
    expect(block).toContain('invalidatesTags')
    expect(block).toContain("'Policy'")
    expect(block).toContain("'MyPermissions'")
  })

  it('should_deletePolicy_invalidate_Policy_and_MyPermissions', () => {
    const block = sliceEndpoint(src(), 'deletePolicy', 'mutation')
    expect(block).not.toBeNull()
    expect(block).toContain('invalidatesTags')
    expect(block).toContain("'Policy'")
    expect(block).toContain("'MyPermissions'")
  })

  it('should_batchUpsertPolicies_invalidate_Policy_and_MyPermissions', () => {
    const block = sliceEndpoint(src(), 'batchUpsertPolicies', 'mutation')
    expect(block).not.toBeNull()
    expect(block).toContain('invalidatesTags')
    expect(block).toContain("'Policy'")
    expect(block).toContain("'MyPermissions'")
  })

  it('should_createFieldMask_invalidate_FieldMask_and_MyPermissions', () => {
    const block = sliceEndpoint(src(), 'createFieldMask', 'mutation')
    expect(block).not.toBeNull()
    expect(block).toContain('invalidatesTags')
    expect(block).toContain("'FieldMask'")
    expect(block).toContain("'MyPermissions'")
  })

  it('should_deleteFieldMask_invalidate_FieldMask_and_MyPermissions', () => {
    const block = sliceEndpoint(src(), 'deleteFieldMask', 'mutation')
    expect(block).not.toBeNull()
    expect(block).toContain('invalidatesTags')
    expect(block).toContain("'FieldMask'")
    expect(block).toContain("'MyPermissions'")
  })
})

// ─── batchUpsertPolicies — request body shape ─────────────────────────────────

describe('accessControlApi — batchUpsertPolicies body shape', () => {
  it('should_wrap_items_in_updates_array', () => {
    const block = sliceEndpoint(src(), 'batchUpsertPolicies', 'mutation')
    expect(block).not.toBeNull()
    expect(block).toContain('updates:')
  })

  it('should_wrap_each_policy_in_policy_key', () => {
    const block = sliceEndpoint(src(), 'batchUpsertPolicies', 'mutation')
    expect(block).toContain('{ policy }')
  })
})

// ─── Exported hooks ────────────────────────────────────────────────────────────

describe('accessControlApi — exported hooks', () => {
  const expectedHooks = [
    'useGetMyPermissionsQuery',
    'useListPoliciesQuery',
    'useCreatePolicyMutation',
    'useUpdatePolicyMutation',
    'useDeletePolicyMutation',
    'useBatchUpsertPoliciesMutation',
    'useGetPolicyMatrixQuery',
    'useListFieldMasksQuery',
    'useCreateFieldMaskMutation',
    'useDeleteFieldMaskMutation',
    'useListPolicyAuditLogQuery',
  ]

  for (const hook of expectedHooks) {
    it(`should_export_${hook}`, () => {
      expect(src()).toContain(hook)
    })
  }
})
