import { useGetUnreadCountQuery, useListNotificationsQuery } from '../notificationApi'
import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/store'
import { useWorkflowSse } from '@/features/governance/useWorkflowSse'
import { notificationApi } from '../notificationApi'

export function useNotifications(options?: { page?: number; size?: number; pollingInterval?: number }) {
  const { page = 0, size = 10, pollingInterval = 30000 } = options || {}
  const dispatch = useAppDispatch()
  const userId = useAppSelector((state) => state.auth.currentUser?.userId ?? null)

  const { data, isLoading, error, refetch } = useListNotificationsQuery(
    { page, size },
    {
      pollingInterval,
    }
  )

  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    pollingInterval,
  })

  useWorkflowSse({
    userId,
    enabled: Boolean(userId),
    onNotification: () => {
      dispatch(notificationApi.util.invalidateTags(['Notification']))
    },
  })

  useEffect(() => {
    if (!userId) return
    dispatch(notificationApi.util.invalidateTags(['Notification']))
  }, [dispatch, userId])

  const notifications = data?.data?.content || []
  const unreadCount = unreadData?.data ?? notifications.filter((n) => !n.read).length
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
