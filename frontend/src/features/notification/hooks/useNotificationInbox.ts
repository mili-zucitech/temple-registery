import {
  useListNotificationsQuery,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
} from '../notificationApi'

export function useNotificationInbox(page: number) {
  const { data, isLoading, isFetching, isError } = useListNotificationsQuery({ page, size: 20 })
  const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllReadMutation()
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation()
  const [clearAll, { isLoading: isClearing }] = useClearAllNotificationsMutation()

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
    isDeleting,
    isClearing,
    markAllRead,
    deleteNotification,
    clearAll,
  }
}
