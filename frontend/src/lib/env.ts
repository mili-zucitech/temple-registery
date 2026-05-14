/**
 * Environment variable accessors.
 * All VITE_ variables must be declared here to enable strict-mode SSR-safe access.
 */
export const VITE_API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''
