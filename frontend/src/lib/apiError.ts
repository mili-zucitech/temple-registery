/**
 * Extracts a human-readable error message from an RTK Query error.
 *
 * Priority order:
 * 1. Backend `response.message` (e.g. "Trust registration number already exists.")
 * 2. Validation field errors joined together
 * 3. HTTP network error message
 * 4. Generic fallback (caller-supplied, never the string "Failed")
 */
export function extractApiErrorMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any,
  fallback = 'An unexpected error occurred. Please try again.',
): string {
  if (!error) return fallback

  // RTK Query FetchBaseQueryError with a JSON body
  if (error.data) {
    const data = error.data as Record<string, unknown>
    // 1. Backend ApiResponse message
    if (typeof data.message === 'string' && data.message.length > 0) {
      return data.message
    }
    // 2. Validation errors array (Spring @Valid field errors)
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const messages = data.errors
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((e: any) => (typeof e === 'string' ? e : e.message ?? e.defaultMessage ?? ''))
        .filter(Boolean)
      if (messages.length > 0) return messages.join('. ')
    }
    // 3. Top-level error field (some frameworks use this)
    if (typeof data.error === 'string' && data.error.length > 0) {
      return data.error
    }
  }

  // RTK Query FetchBaseQueryError: network/fetch level error
  if (error.error && typeof error.error === 'string') {
    // e.g. "TypeError: Failed to fetch" — return a friendly version
    if (error.error.includes('Failed to fetch') || error.error.includes('NetworkError')) {
      return 'Network error. Please check your connection and try again.'
    }
    return error.error
  }

  // Plain JS Error
  if (error instanceof Error && error.message) return error.message

  return fallback
}
