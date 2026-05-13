import { useState } from 'react'
import { useGetTempleTimelineQuery } from '@/features/timeline/timelineApi'
import type { TempleTimelineEventResponse } from '@/features/timeline/timelineTypes'

const PAGE_SIZE = 20

interface UseTempleTimelineResult {
  events: TempleTimelineEventResponse[]
  isLoading: boolean
  isFetchingMore: boolean
  isError: boolean
  hasMore: boolean
  loadMore: () => void
  totalElements: number
}

/**
 * Custom hook for loading and paginating the temple timeline.
 *
 * Accumulates pages client-side so the timeline grows as the user
 * clicks "Load more" — matching the append-only UX pattern.
 */
export function useTempleTimeline(templeId: number): UseTempleTimelineResult {
  const [page, setPage] = useState(0)
  const [allEvents, setAllEvents] = useState<TempleTimelineEventResponse[]>([])
  const [seenPages, setSeenPages] = useState<Set<number>>(new Set())

  const { data, isLoading, isFetching, isError } = useGetTempleTimelineQuery(
    { templeId, page, size: PAGE_SIZE },
    { skip: !templeId }
  )

  // Accumulate new pages without duplicates
  if (data?.data && !seenPages.has(page)) {
    setSeenPages((prev) => new Set(prev).add(page))
    setAllEvents((prev) => [...prev, ...(data.data.content ?? [])])
  }

  const totalElements = data?.data?.totalElements ?? 0
  const hasMore = allEvents.length < totalElements

  const loadMore = () => {
    if (hasMore && !isFetching) {
      setPage((p) => p + 1)
    }
  }

  return {
    events: allEvents,
    isLoading: isLoading && page === 0,
    isFetchingMore: isFetching && page > 0,
    isError,
    hasMore,
    loadMore,
    totalElements,
  }
}
