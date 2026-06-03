import { usePermissionsContext } from '../context/PermissionsContext'

export interface UsePermissionsResult {
  /** Returns true if the current user has access to the given target key. */
  can: (targetKey: string) => boolean
  /** Returns true if the given field should be visually masked. */
  isMasked: (fieldKey: string) => boolean
  /** Returns the mask pattern string for a field (e.g. '****'). */
  maskPattern: (fieldKey: string) => string
  /** True while permissions are being fetched on initial mount. */
  isLoading: boolean
}

/**
 * Access the current user's effective permissions from the PermissionsContext.
 * Must be rendered inside <PermissionsProvider>.
 *
 * Fails-open: if permissions have not yet loaded or the API errored,
 * `can()` returns true and `isMasked()` returns false.
 */
export function usePermissions(): UsePermissionsResult {
  const ctx = usePermissionsContext()
  return {
    can: ctx.can,
    isMasked: ctx.isMasked,
    maskPattern: ctx.maskPattern,
    isLoading: ctx.isLoading,
  }
}
