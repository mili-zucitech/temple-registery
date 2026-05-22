/**
 * Integration tests for PermissionsProvider + usePermissionsContext.
 *
 * The RTK Query + MSW v2 combo has a known AbortSignal incompatibility in jsdom,
 * so network calls are mocked at the module level (vi.mock) and the hook is
 * driven by controlled return values â€” the same approach used in hook tests
 * across this codebase.
 *
 * Tests verify the fail-open contract, DENY resolution, field mask resolution,
 * and the loading/error states of the PermissionsProvider.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { PermissionsProvider, usePermissionsContext } from '../context/PermissionsContext'

// â”€â”€â”€ Mock useGetMyPermissionsQuery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const mockQuery = vi.fn()

vi.mock('../accessControlApi', () => ({
  accessControlApi: {
    reducerPath: 'accessControlApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useGetMyPermissionsQuery: () => mockQuery(),
}))

// â”€â”€â”€ Test consumer component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PermissionsDisplay({ targetKey, fieldKey }: { targetKey: string; fieldKey: string }) {
  const { can, isMasked, maskPattern, isLoading } = usePermissionsContext()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="can">{String(can(targetKey))}</span>
      <span data-testid="masked">{String(isMasked(fieldKey))}</span>
      <span data-testid="pattern">{maskPattern(fieldKey)}</span>
    </div>
  )
}

function renderPermissions(
  targetKey = 'page.dc.export',
  fieldKey = 'field.temple.bank_account',
  wrapper?: ({ children }: { children: ReactNode }) => JSX.Element
) {
  const Wrap = wrapper ?? (({ children }: { children: ReactNode }) => <>{children}</>)
  return render(
    <Wrap>
      <PermissionsProvider>
        <PermissionsDisplay targetKey={targetKey} fieldKey={fieldKey} />
      </PermissionsProvider>
    </Wrap>
  )
}

// â”€â”€â”€ Loading / fail-open â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('PermissionsProvider â€” loading state', () => {
  beforeEach(() => {
    mockQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false })
  })

  it('should_returnTrue_when_permissionsAreLoading_failOpen', () => {
    renderPermissions('any.key', 'any.field')

    expect(screen.getByTestId('loading').textContent).toBe('true')
    expect(screen.getByTestId('can').textContent).toBe('true')
    expect(screen.getByTestId('masked').textContent).toBe('false')
  })
})

// â”€â”€â”€ Error / fail-open â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('PermissionsProvider â€” error state', () => {
  beforeEach(() => {
    mockQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true })
  })

  it('should_returnTrue_when_permissionsEndpointReturnsError_failOpen', () => {
    renderPermissions('section.dc.search.declaration_status', 'field.temple.bank_account')

    expect(screen.getByTestId('loading').textContent).toBe('false')
    expect(screen.getByTestId('can').textContent).toBe('true')
    expect(screen.getByTestId('masked').textContent).toBe('false')
  })
})

// â”€â”€â”€ Successful data â€” can() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('PermissionsProvider â€” can()', () => {
  it('should_returnTrue_when_noExplicitPolicyForKey', () => {
    mockQuery.mockReturnValue({
      data: { success: true, data: { permissions: {}, fieldMasks: {} } },
      isLoading: false,
      isError: false,
    })

    renderPermissions('section.dc.search.saved_filters', 'field.temple.bank_account')

    expect(screen.getByTestId('can').textContent).toBe('true')
  })

  it('should_returnFalse_when_denyPolicyExistsForKey', () => {
    mockQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          permissions: { 'section.dc.search.card_status': 'DENY' },
          fieldMasks: {},
        },
      },
      isLoading: false,
      isError: false,
    })

    renderPermissions('section.dc.search.card_status', 'field.temple.bank_account')

    expect(screen.getByTestId('can').textContent).toBe('false')
  })

  it('should_returnTrue_when_allowPolicyExistsForKey', () => {
    mockQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          permissions: { 'kpi.ta.search.total_temples': 'ALLOW' },
          fieldMasks: {},
        },
      },
      isLoading: false,
      isError: false,
    })

    renderPermissions('kpi.ta.search.total_temples', 'field.temple.bank_account')

    expect(screen.getByTestId('can').textContent).toBe('true')
  })

  it('should_returnTrue_when_denyPolicyExistsForDifferentKey_failOpen', () => {
    mockQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          permissions: { 'section.dc.search.trust_registered': 'DENY' },
          fieldMasks: {},
        },
      },
      isLoading: false,
      isError: false,
    })

    // The DENY is for a different key â€” the requested key has no policy â†’ ALLOW
    renderPermissions('section.ta.search.saved_filters', 'field.temple.bank_account')

    expect(screen.getByTestId('can').textContent).toBe('true')
  })
})

// â”€â”€â”€ Successful data â€” field masks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('PermissionsProvider â€” isMasked() / maskPattern()', () => {
  it('should_returnTrue_when_fieldKeyHasActiveMask', () => {
    mockQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          permissions: {},
          fieldMasks: { 'field.temple.bank_account': '****' },
        },
      },
      isLoading: false,
      isError: false,
    })

    renderPermissions('any.key', 'field.temple.bank_account')

    expect(screen.getByTestId('masked').textContent).toBe('true')
    expect(screen.getByTestId('pattern').textContent).toBe('****')
  })

  it('should_returnFalse_when_fieldKeyHasNoMask', () => {
    mockQuery.mockReturnValue({
      data: { success: true, data: { permissions: {}, fieldMasks: {} } },
      isLoading: false,
      isError: false,
    })

    renderPermissions('any.key', 'field.temple.name')

    expect(screen.getByTestId('masked').textContent).toBe('false')
  })

  it('should_returnDefaultMaskPattern_when_fieldHasNoExplicitPattern', () => {
    mockQuery.mockReturnValue({
      data: { success: true, data: { permissions: {}, fieldMasks: {} } },
      isLoading: false,
      isError: false,
    })

    renderPermissions('any.key', 'field.temple.name')

    expect(screen.getByTestId('pattern').textContent).toBe('****')
  })

  it('should_returnCustomMaskPattern_when_fieldHasCustomPattern', () => {
    mockQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          permissions: {},
          fieldMasks: { 'field.temple.bank_account': 'XX-XXXX-XXXX' },
        },
      },
      isLoading: false,
      isError: false,
    })

    renderPermissions('any.key', 'field.temple.bank_account')

    expect(screen.getByTestId('pattern').textContent).toBe('XX-XXXX-XXXX')
  })
})
