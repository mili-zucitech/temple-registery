/**
 * Unit tests for PolicyGate component.
 *
 * PolicyGate reads permissions from PermissionsContext. Tests inject a
 * controlled context value directly so behavior is deterministic
 * without any network or store dependency.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { PermissionsContext, type PermissionsContextValue } from '../context/PermissionsContext'
import { PolicyGate } from './PolicyGate'

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

function renderGate(
  ctx: PermissionsContextValue,
  props: Parameters<typeof PolicyGate>[0]
) {
  return render(
    <PermissionsContext.Provider value={ctx}>
      <PolicyGate {...props} />
    </PermissionsContext.Provider>
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PolicyGate', () => {
  describe('Access allowed', () => {
    it('should_renderChildren_when_targetKeyIsAllowed', () => {
      const ctx = makeContext({ can: () => true })

      renderGate(ctx, {
        target: 'button.ta.employees.add',
        children: <button>Add Employee</button>,
      })

      expect(screen.getByRole('button', { name: 'Add Employee' })).toBeInTheDocument()
    })

    it('should_renderChildren_when_permissionsAreLoading_failOpen', () => {
      // Fail-open: while loading, context defaults to can()=true
      const ctx = makeContext({ isLoading: true, can: () => true })

      renderGate(ctx, {
        target: 'page.dc.export',
        children: <div>Export Page</div>,
      })

      expect(screen.getByText('Export Page')).toBeInTheDocument()
    })
  })

  describe('Access denied', () => {
    it('should_renderNothing_when_targetKeyIsDenied_andNoFallback', () => {
      const ctx = makeContext({ can: () => false })

      renderGate(ctx, {
        target: 'button.ta.employees.add',
        children: <button>Add Employee</button>,
      })

      expect(screen.queryByRole('button', { name: 'Add Employee' })).not.toBeInTheDocument()
    })

    it('should_renderFallback_when_targetKeyIsDenied', () => {
      const ctx = makeContext({ can: () => false })

      renderGate(ctx, {
        target: 'button.ta.employees.add',
        children: <button>Add Employee</button>,
        fallback: <span>Access Restricted</span>,
      })

      expect(screen.queryByRole('button', { name: 'Add Employee' })).not.toBeInTheDocument()
      expect(screen.getByText('Access Restricted')).toBeInTheDocument()
    })

    it('should_renderChildren_for_allowed_key_and_deny_for_another', () => {
      const ctx = makeContext({
        can: (key) => key !== 'button.admin.user.deactivate',
      })

      const { rerender } = render(
        <PermissionsContext.Provider value={ctx}>
          <PolicyGate target="page.admin.users">
            <div>Users Page</div>
          </PolicyGate>
        </PermissionsContext.Provider>
      )

      expect(screen.getByText('Users Page')).toBeInTheDocument()

      rerender(
        <PermissionsContext.Provider value={ctx}>
          <PolicyGate target="button.admin.user.deactivate" fallback={<span>Hidden</span>}>
            <button>Deactivate</button>
          </PolicyGate>
        </PermissionsContext.Provider>
      )

      expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument()
      expect(screen.getByText('Hidden')).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should_renderChildren_when_targetKey_isEmptyString_andContextAllows', () => {
      const ctx = makeContext({ can: () => true })

      renderGate(ctx, {
        target: '',
        children: <div>Content</div>,
      })

      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })
})
