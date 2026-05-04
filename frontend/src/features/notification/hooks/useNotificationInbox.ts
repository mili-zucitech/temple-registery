import { useListNotificationsQuery, useMarkAllReadMutation } from '../notificationApi'

export function useNotificationInbox(page: number) {
  const { data, isLoading, isFetching, isError } = useListNotificationsQuery({ page, size: 20 })
  const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllReadMutation()

  const notifications = data?.data?.content || []
  const totalPages = data?.data?.totalPages || 0
  const totalElements = data?.data?.totalElements || 0

  return {
    notifications,
    totalPages,
    totalElements,
    isLoading,
    isFetching,
    isError,
    isMarkingAllRead,
    markAllRead,
  }
}
