import { useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { workflowApi } from '../governance/workflowApi'
import { VITE_API_BASE_URL } from '../../lib/env'
import type { RootState } from '@/store'

interface SseNotification {
  type: 'notification' | 'badge' | 'connected'
  title?: string
  body?: string
  unreadCount?: number
}

interface UseWorkflowSseOptions {
  userId: number | null
  enabled?: boolean
  onNotification?: (notification: SseNotification) => void
}

/**
 * SSE hook for real-time workflow notification push.
 *
 * Connects to GET /api/v1/notifications/stream.
 * Handles reconnect with exponential backoff on disconnect.
 * Invalidates RTK Query badge count cache on every event.
 */
export const useWorkflowSse = ({
  userId,
  enabled = true,
  onNotification,
}: UseWorkflowSseOptions) => {
  const dispatch = useDispatch()
  const accessToken = useSelector((state: RootState) => state.auth.accessToken)
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryDelayRef = useRef(2000)

  const connect = useCallback(() => {
    if (!userId || !enabled) return
    if (esRef.current?.readyState === EventSource.OPEN) return

    const baseUrl = `${VITE_API_BASE_URL}/api/v1/notifications/stream`
    const url = accessToken
      ? `${baseUrl}?token=${encodeURIComponent(accessToken)}`
      : baseUrl

    const es = new EventSource(url, { withCredentials: true })
    esRef.current = es

    es.addEventListener('connected', () => {
      retryDelayRef.current = 2000 // reset backoff on successful connect
    })

    es.addEventListener('notification', (event) => {
      try {
        const data = JSON.parse(event.data) as { title: string; body: string }
        onNotification?.({ type: 'notification', ...data })
        // Invalidate badge count and workflow state in RTK Query cache
        dispatch(workflowApi.util.invalidateTags(['BadgeCount', 'WorkflowState', 'Dashboard']))
      } catch (e) {
        console.warn('[SSE] Failed to parse notification event', e)
      }
    })

    es.addEventListener('badge', (event) => {
      try {
        const data = JSON.parse(event.data) as { unreadCount: number }
        onNotification?.({ type: 'badge', unreadCount: data.unreadCount })
        dispatch(workflowApi.util.invalidateTags(['BadgeCount']))
      } catch (e) {
        console.warn('[SSE] Failed to parse badge event', e)
      }
    })

    es.onerror = () => {
      es.close()
      esRef.current = null
      // Exponential backoff: 2s, 4s, 8s, max 30s
      const delay = Math.min(retryDelayRef.current * 2, 30000)
      retryDelayRef.current = delay
      reconnectTimeoutRef.current = setTimeout(connect, delay)
    }
  }, [userId, enabled, accessToken, dispatch, onNotification])

  useEffect(() => {
    connect()
    return () => {
      esRef.current?.close()
      esRef.current = null
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    }
  }, [connect])

  const disconnect = useCallback(() => {
    esRef.current?.close()
    esRef.current = null
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
  }, [])

  return { disconnect }
}
