/**
 * Unit tests for usePermissions hook.
 *
 * Since usePermissions reads from PermissionsContext, tests inject a
 * controlled PermissionsContext.Provider value rather than going
 * through the network — the context/provider integration is tested separately.
 */
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { PermissionsContext, type PermissionsContextValue } from '../context/PermissionsContext'
import { usePermissions } from './usePermissions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeContext(overrides: Partial<PermissionsContextValue> = {}): PermissionsContextValue {
  return {
    can: () => true,
    isMasked: () => false,
    maskPattern: () => '****',
    isLoading: false,
    ...overrides,
  }
}

function wrapWithContext(ctx: PermissionsContextValue) {
  return ({ children }: { children: ReactNode }) => (
    <PermissionsContext.Provider value={ctx}>{children}</PermissionsContext.Provider>
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('usePermissions', () => {
  describe('can', () => {
    it('should_returnTrue_when_contextAllowsTargetKey', () => {
      const ctx = makeContext({ can: (key) => key !== 'button.ta.employees.add' })
      const { result } = renderHook(() => usePermissions(), { wrapper: wrapWithContext(ctx) })

      expect(result.current.can('page.dc.export')).toBe(true)
    })

    it('should_returnFalse_when_contextDeniesTargetKey', () => {
      const ctx = makeContext({ can: () => false })
      const { result } = renderHook(() => usePermissions(), { wrapper: wrapWithContext(ctx) })

      expect(result.current.can('button.ta.employees.add')).toBe(false)
    })

    it('should_returnTrue_when_permissionsAreLoading_failOpen', () => {
      // Fail-open: while loading, can() defaults to true in the context default
      const ctx = makeContext({ isLoading: true, can: () => true })
      const { result } = renderHook(() => usePermissions(), { wrapper: wrapWithContext(ctx) })

      expect(result.current.can('any.key')).toBe(true)
      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('isMasked', () => {
    it('should_returnTrue_when_fieldKeyHasActiveMask', () => {
      const ctx = makeContext({ isMasked: (key) => key === 'field.temple.bank_account' })
      const { result } = renderHook(() => usePermissions(), { wrapper: wrapWithContext(ctx) })

      expect(result.current.isMasked('field.temple.bank_account')).toBe(true)
    })

    it('should_returnFalse_when_fieldKeyHasNoMask', () => {
      const ctx = makeContext({ isMasked: () => false })
      const { result } = renderHook(() => usePermissions(), { wrapper: wrapWithContext(ctx) })

      expect(result.current.isMasked('field.user.mobile')).toBe(false)
    })
  })

  describe('maskPattern', () => {
    it('should_returnMaskPattern_when_fieldKeyHasMask', () => {
      const ctx = makeContext({ maskPattern: (key) => key === 'field.temple.bank_account' ? 'XX-XXXX' : '****' })
      const { result } = renderHook(() => usePermissions(), { wrapper: wrapWithContext(ctx) })

      expect(result.current.maskPattern('field.temple.bank_account')).toBe('XX-XXXX')
    })

    it('should_returnDefaultPattern_when_fieldKeyNotMasked', () => {
      const ctx = makeContext({ maskPattern: () => '****' })
      const { result } = renderHook(() => usePermissions(), { wrapper: wrapWithContext(ctx) })

      expect(result.current.maskPattern('field.user.mobile')).toBe('****')
    })
  })

  describe('isLoading', () => {
    it('should_exposeIsLoading_fromContext', () => {
      const ctx = makeContext({ isLoading: true })
      const { result } = renderHook(() => usePermissions(), { wrapper: wrapWithContext(ctx) })

      expect(result.current.isLoading).toBe(true)
    })

    it('should_returnFalse_when_permissionsLoaded', () => {
      const ctx = makeContext({ isLoading: false })
      const { result } = renderHook(() => usePermissions(), { wrapper: wrapWithContext(ctx) })

      expect(result.current.isLoading).toBe(false)
    })
  })
})
