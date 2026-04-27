import { useState } from 'react'
import { useListNotificationsQuery, useMarkAllReadMutation, NotificationPriority, NotificationCategory } from '../notificationApi'
import { NotificationCard } from '../components/NotificationCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Loader2, Search, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotificationInboxPage() {
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'ALL'>('ALL')
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all')

  const { data, isLoading, isFetching } = useListNotificationsQuery({ page, size: 20 })
  const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllReadMutation()

  const notifications = data?.data?.content || []
  const totalPages = data?.data?.totalPages || 0
  const totalElements = data?.data?.totalElements || 0

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !notification.title.toLowerCase().includes(query) &&
        !notification.body.toLowerCase().includes(query)
      ) {
        return false
      }
    }

    // Priority filter
    if (priorityFilter !== 'ALL' && notification.priority !== priorityFilter) {
      return false
    }

    // Category filter
    if (categoryFilter !== 'ALL' && notification.category !== categoryFilter) {
      return false
    }

    // Tab filter
    if (activeTab === 'unread' && notification.read) {
      return false
    }
    if (activeTab === 'read' && !notification.read) {
      return false
    }

    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {totalElements} total • {unreadCount} unread
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/notifications/preferences">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </Button>
          </Link>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllRead} disabled={isMarkingAllRead}>
              {isMarkingAllRead ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as NotificationPriority | 'ALL')}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as NotificationCategory | 'ALL')}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="SUBMISSION">Submissions</SelectItem>
              <SelectItem value="APPROVAL">Approvals</SelectItem>
              <SelectItem value="REJECTION">Rejections</SelectItem>
              <SelectItem value="CLARIFICATION">Clarifications</SelectItem>
              <SelectItem value="SITE_VISIT">Site Visits</SelectItem>
              <SelectItem value="REMINDER">Reminders</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="DOCUMENT">Documents</SelectItem>
              <SelectItem value="SYSTEM">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No notifications found</p>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
