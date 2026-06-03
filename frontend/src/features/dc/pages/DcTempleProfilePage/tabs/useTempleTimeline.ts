import { useState, useEffect, useRef } from 'react'
import { useGetTempleTimelineQuery } from '@/features/timeline/timelineApi'
import type { TempleTimelineEventResponse } from '@/features/timeline/timelineTypes'

const PAGE_SIZE = 50

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
 *
 * Uses a ref for duplicate-page tracking so the accumulation effect
 * does not retrigger on every render (avoids setState-during-render).
 * Resets all state when templeId changes to avoid showing stale data.
 */
export function useTempleTimeline(templeId: number): UseTempleTimelineResult {
  const [page, setPage] = useState(0)
  const [allEvents, setAllEvents] = useState<TempleTimelineEventResponse[]>([])
  // Use a ref for seenPages so we can mutate it without triggering re-renders.
  const seenPagesRef = useRef(new Set<number>())

  // Reset accumulated state when the temple changes.
  useEffect(() => {
    setPage(0)
    setAllEvents([])
    seenPagesRef.current = new Set()
  }, [templeId])

  const { data, isLoading, isFetching, isError } = useGetTempleTimelineQuery(
    { templeId, page, size: PAGE_SIZE },
    {
      skip: !templeId,
      // Always re-fetch page 0 when the component mounts (e.g. Timeline tab opened)
      // so the data is never stale from a previous tab-visit's cache.
      refetchOnMountOrArgChange: true,
    }
  )

  // Accumulate pages in an effect so state updates never happen during render.
  useEffect(() => {
    if (data?.data && !seenPagesRef.current.has(page)) {
      seenPagesRef.current.add(page)
      setAllEvents((prev) => [...prev, ...(data.data.content ?? [])])
    }
  }, [data, page])

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
