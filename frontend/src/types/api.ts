/** Standard wrapper for all backend responses */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errorCode?: string
  errors?: string[]
  timestamp: string
  requestId: string
}

/** Paginated list wrapper */
export interface PaginatedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type SortOrder = 'asc' | 'desc'

export interface SelectOption {
  value: string | number
  label: string
}

export interface PageParams {
  page: number
  size: number
}
