import { useListNotificationsQuery, useMarkAllReadMutation } from '../notificationApi'

export function useNotificationDropdown() {
  const { data, isLoading, isError, refetch } = useListNotificationsQuery({ page: 0, size: 5 })
  const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllReadMutation()

  const notifications = data?.data?.content || []
  const hasUnread = notifications.some((n) => !n.read)

  const handleMarkAllRead = async () => {
    await markAllRead().unwrap()
    refetch()
  }

  return { notifications, hasUnread, isLoading, isError, isMarkingAllRead, refetch, handleMarkAllRead }
}
