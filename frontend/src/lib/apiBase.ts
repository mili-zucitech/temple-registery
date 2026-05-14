const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

/**
 * Returns the canonical v1 API base URL.
 * - If VITE_API_BASE_URL is unset, defaults to /api/v1.
 * - If env points to host root, appends /api/v1.
 * - If env already points to /api/v1, keeps it as-is.
 */
export function getApiV1BaseUrl(): string {
  const raw = String(import.meta.env.VITE_API_BASE_URL ?? '').trim()
  if (!raw) return '/api/v1'

  const normalized = stripTrailingSlash(raw)
  if (/\/api\/v\d+$/i.test(normalized)) {
    return normalized
  }
  return `${normalized}/api/v1`
}

/**
 * Returns API root URL without a version suffix.
 * Example: https://host/api/v1 -> https://host
 */
export function getApiRootBaseUrl(): string {
  return getApiV1BaseUrl().replace(/\/api\/v\d+$/i, '')
}
