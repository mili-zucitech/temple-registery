import type { ReactNode } from 'react'
import { usePermissions } from '../hooks/usePermissions'

interface PolicyGateProps {
  /** The target key to evaluate (e.g. 'button.ta.employees.add'). */
  target: string
  /** Content to render when access is allowed. */
  children: ReactNode
  /** Content to render when access is denied. Defaults to null (renders nothing). */
  fallback?: ReactNode
}

/**
 * Conditionally renders children based on the current user's DACVM policy for the given target key.
 *
 * Fails-open: renders children while permissions are loading or if an error occurred.
 *
 * @example
 * <PolicyGate target={TARGET_KEYS.BUTTON_TA_EMPLOYEES_ADD}>
 *   <Button>Add Employee</Button>
 * </PolicyGate>
 */
export function PolicyGate({ target, children, fallback = null }: PolicyGateProps) {
  const { can } = usePermissions()

  if (!can(target)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
