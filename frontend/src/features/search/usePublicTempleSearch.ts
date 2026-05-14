import { useCallback, useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSearchTemplesQuery } from '@/features/temple-profile/hooks/templeApi'
import type { TempleSearchResultResponse } from '@/features/temple-profile/hooks/templeTypes'

function parseIntParam(value: string | null): number | undefined {
  const n = Number(value)
  return value !== null && !isNaN(n) ? n : undefined
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export interface PublicSearchFilters {
  keyword?: string
  deityName?: string
  grade?: string[]
  districtId?: number
  talukId?: number
  tradition?: string
  trustRegistered?: boolean
}

export function usePublicTempleSearch() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? '0')
  const size = Number(searchParams.get('size') ?? '10')

  const [localKeyword, setLocalKeyword] = useState(searchParams.get('keyword') ?? '')
  const [localDeityName, setLocalDeityName] = useState(searchParams.get('deityName') ?? '')

  const debouncedKeyword = useDebounce(localKeyword, 350)
  const debouncedDeityName = useDebounce(localDeityName, 350)

  useEffect(() => {
    const current = searchParams.get('keyword') ?? ''
    if (debouncedKeyword !== current) {
      setSearchParams((prev) => {
        const u = new URLSearchParams(prev)
        u.set('page', '0')
        if (debouncedKeyword) u.set('keyword', debouncedKeyword)
        else u.delete('keyword')
        return u
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword])

  useEffect(() => {
    const current = searchParams.get('deityName') ?? ''
    if (debouncedDeityName !== current) {
      setSearchParams((prev) => {
        const u = new URLSearchParams(prev)
        u.set('page', '0')
        if (debouncedDeityName) u.set('deityName', debouncedDeityName)
        else u.delete('deityName')
        return u
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDeityName])

  useEffect(() => { setLocalKeyword(searchParams.get('keyword') ?? '') }, [searchParams])
  useEffect(() => { setLocalDeityName(searchParams.get('deityName') ?? '') }, [searchParams])

  const filters = useMemo<PublicSearchFilters>(() => ({
    keyword: searchParams.get('keyword') ?? undefined,
    deityName: searchParams.get('deityName') ?? undefined,
    grade: searchParams.get('grade') ? searchParams.get('grade')!.split(',') : undefined,
    districtId: parseIntParam(searchParams.get('districtId')),
    talukId: parseIntParam(searchParams.get('talukId')),
    tradition: searchParams.get('tradition') ?? undefined,
    trustRegistered:
      searchParams.get('trustRegistered') === 'true'
        ? true
        : searchParams.get('trustRegistered') === 'false'
        ? false
        : undefined,
  }), [searchParams])

  const queryFilters = useMemo<import('@/features/temple-profile/hooks/templeTypes').TempleSearchFilterRequest>(() => ({
    name: filters.keyword,
    grade: filters.grade?.[0] as import('@/features/temple-profile/hooks/templeTypes').TempleGrade | undefined,
    tradition: filters.tradition as import('@/features/temple-profile/hooks/templeTypes').ReligiousTradition | undefined,
    districtId: filters.districtId,
    talukId: filters.talukId,
    trustRegistered: filters.trustRegistered,
  }), [filters])

  const { data, isLoading, isFetching, isError } = useSearchTemplesQuery(
    { filters: queryFilters, page, size },
    { refetchOnMountOrArgChange: true },
  )

  const temples: TempleSearchResultResponse[] = data?.data?.content ?? []
  const total = data?.data?.totalElements ?? 0
  const totalPages = data?.data?.totalPages ?? 0

  const applyFilters = useCallback(
    (next: Partial<PublicSearchFilters>) => {
      setSearchParams((prev) => {
        const u = new URLSearchParams(prev)
        u.set('page', '0')
        Object.entries(next).forEach(([k, v]) => {
          if (v === undefined || v === null || v === '') {
            u.delete(k)
          } else if (Array.isArray(v)) {
            if (v.length > 0) u.set(k, v.join(','))
            else u.delete(k)
          } else {
            u.set(k, String(v))
          }
        })
        return u
      })
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams({ page: '0', size: String(size) })
    setLocalKeyword('')
    setLocalDeityName('')
  }, [setSearchParams, size])

  const goToPage = useCallback(
    (p: number) => {
      setSearchParams((prev) => {
        const u = new URLSearchParams(prev)
        u.set('page', String(p))
        return u
      })
    },
    [setSearchParams],
  )

  return {
    temples,
    total,
    totalPages,
    filters,
    page,
    size,
    isLoading,
    isFetching,
    isError,
    localKeyword,
    setLocalKeyword,
    localDeityName,
    setLocalDeityName,
    applyFilters,
    clearFilters,
    goToPage,
  }
}
