import { useListNotificationsQuery } from '../notificationApi'
import { useEffect } from 'react'

export function useNotifications(options?: { page?: number; size?: number; pollingInterval?: number }) {
  const { page = 0, size = 10, pollingInterval = 30000 } = options || {}

  const { data, isLoading, error, refetch } = useListNotificationsQuery(
    { page, size },
    {
      pollingInterval, // Poll every 30 seconds by default
    }
  )

  const notifications = data?.data?.content || []
  const unreadCount = notifications.filter((n) => !n.read).length
  const totalElements = data?.data?.totalElements || 0
  const totalPages = data?.data?.totalPages || 0

  return {
    notifications,
    unreadCount,
    totalElements,
    totalPages,
    isLoading,
    error,
    refetch,
  }
}
