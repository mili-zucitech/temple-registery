import { useListNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } from '@/features/notification/notificationApi'

export function useTaActivity(page: number, pageSize: number) {
  const { data, isLoading, isError, refetch } = useListNotificationsQuery({ page, size: pageSize })
  const [markRead, { isLoading: isMarking }] = useMarkReadMutation()
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllReadMutation()

  const notifications = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0
  const totalElements = data?.data?.totalElements ?? 0
  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    totalPages,
    totalElements,
    unreadCount,
    isLoading,
    isError,
    isMarking,
    isMarkingAll,
    markRead: (id: number) => markRead(id),
    markAllRead: () => markAllRead(),
    refetch,
  }
}
