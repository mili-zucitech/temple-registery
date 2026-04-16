
import { useAppDispatch, useAppSelector } from '@/app/store'
import { setFilters, setPage } from './templeSlice'
import { useSearchTemplesQuery, useGetTempleByIdQuery } from './templeApi'
import type { TempleSearchFilterRequest } from './templeTypes'

export function useTempleSearch() {
  const dispatch = useAppDispatch()
  const { activeFilters, currentPage, pageSize } = useAppSelector((s) => s.temple)
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)

  const { data, isLoading, isError } = useSearchTemplesQuery(
    {
      filters: activeFilters,
      page: currentPage,
      size: pageSize,
    },
    { skip: !isAuthenticated }
  )

  const applyFilters = (filters: TempleSearchFilterRequest) => dispatch(setFilters(filters))
  const goToPage = (page: number) => dispatch(setPage(page))

  return {
    temples: data?.data?.content ?? [],
    total: data?.data?.totalElements ?? 0,
    totalPages: data?.data?.totalPages ?? 0,
    isLoading,
    isError,
    currentPage,
    pageSize,
    applyFilters,
    goToPage,
  }
}

export function useTempleDetail(id: number) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const { data, isLoading, isError } = useGetTempleByIdQuery(id, { skip: !id || !isAuthenticated })
  return { temple: data?.data ?? null, isLoading, isError }
}
