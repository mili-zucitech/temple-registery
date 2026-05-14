import {
  useListNotificationsQuery,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
} from '../notificationApi'

export function useNotificationDropdown() {
  const { data, isLoading, isError, refetch } = useListNotificationsQuery({ page: 0, size: 8 })
  const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllReadMutation()
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation()
  const [clearAll, { isLoading: isClearing }] = useClearAllNotificationsMutation()

  const notifications = data?.data?.content || []
  const hasUnread = notifications.some((n) => !n.read)

  const handleMarkAllRead = async () => {
    await markAllRead().unwrap()
    refetch()
  }

  const handleDelete = async (id: number) => {
    await deleteNotification(id).unwrap()
  }

  const handleClearAll = async () => {
    await clearAll().unwrap()
  }

  return {
    notifications,
    hasUnread,
    isLoading,
    isError,
    isMarkingAllRead,
    isDeleting,
    isClearing,
    refetch,
    handleMarkAllRead,
    handleDelete,
    handleClearAll,
  }
}
