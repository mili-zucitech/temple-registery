import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useGetMyPermissionsQuery } from '../accessControlApi'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PermissionsContextValue {
  /** Returns true if the current user can access the given target key. Fails-open: returns true on error. */
  can: (targetKey: string) => boolean
  /** Returns true if the given field key should be masked for the current user. */
  isMasked: (fieldKey: string) => boolean
  /** Returns the mask pattern for the given field key, or '****' as default. */
  maskPattern: (fieldKey: string) => string
  /** True while initial permissions fetch is in-flight. */
  isLoading: boolean
}

const DEFAULT_VALUE: PermissionsContextValue = {
  can: () => true,        // fail-open: no restriction until loaded
  isMasked: () => false,
  maskPattern: () => '****',
  isLoading: false,
}

export const PermissionsContext = createContext<PermissionsContextValue>(DEFAULT_VALUE)

// ─── Provider ─────────────────────────────────────────────────────────────────

interface PermissionsProviderProps {
  children: ReactNode
}

export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const { data, isLoading, isError } = useGetMyPermissionsQuery()

  const value = useMemo<PermissionsContextValue>(() => {
    // On error or while loading, fail-open (all allowed, no masking)
    if (isLoading || isError || !data?.data) {
      return { ...DEFAULT_VALUE, isLoading }
    }

    const { permissions, fieldMasks } = data.data

    return {
      isLoading: false,

      can: (targetKey: string): boolean => {
        const effect = permissions[targetKey]
        // No explicit policy → default ALLOW
        if (!effect) return true
        return effect !== 'DENY'
      },

      isMasked: (fieldKey: string): boolean => {
        const pattern = fieldMasks[fieldKey]
        return !!pattern
      },

      maskPattern: (fieldKey: string): string => {
        return fieldMasks[fieldKey] ?? '****'
      },
    }
  }, [data, isLoading, isError])

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePermissionsContext(): PermissionsContextValue {
  return useContext(PermissionsContext)
}
