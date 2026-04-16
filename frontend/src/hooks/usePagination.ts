import { useState, useCallback } from 'react'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

interface UsePaginationReturn {
  page: number
  pageSize: number
  goToPage: (page: number) => void
  resetPage: () => void
}

export function usePagination(initialPageSize = DEFAULT_PAGE_SIZE): UsePaginationReturn {
  const [page, setPage] = useState(0)
  const pageSize = initialPageSize

  const goToPage = useCallback((p: number) => {
    setPage(p)
  }, [])

  const resetPage = useCallback(() => {
    setPage(0)
  }, [])

  return { page, pageSize, goToPage, resetPage }
}
