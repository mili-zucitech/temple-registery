import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { NoticeListItem } from '../../components/NoticeListItem'
import { CreateNoticeDialog } from '../../components/CreateNoticeDialog'
import { useAdminNotices } from '../../noticeHooks'
import type { NoticeListFilter, NoticeStatus, NoticePriority, NoticeScope } from '../../noticeTypes'
import { Bell } from 'lucide-react'

export function AdminNoticesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<NoticeStatus | ''>('')
  const [priority, setPriority] = useState<NoticePriority | ''>('')
  const [scope, setScope] = useState<NoticeScope | ''>('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const filter: NoticeListFilter = {
    search: debouncedSearch || undefined,
    status: (status as NoticeStatus) || undefined,
    priority: (priority as NoticePriority) || undefined,
    scope: (scope as NoticeScope) || undefined,
  }

  const { data, isLoading, page, goToPage } = useAdminNotices(filter)
  const notices = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold">Notices (All Districts)</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} className="mr-1" />
          Create Notice
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={scope || 'all'} onValueChange={(v) => setScope(v === 'all' ? '' : v as NoticeScope)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All scopes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="GLOBAL">Global</SelectItem>
            <SelectItem value="DISTRICT">District</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v as NoticeStatus)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority || 'all'} onValueChange={(v) => setPriority(v === 'all' ? '' : v as NoticePriority)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && notices.length === 0 && (
        <EmptyState
          title="No notices found"
          description="Create a global or district notice using the button above."
          icon={<Bell size={40} />}
          action={{ label: 'Create Notice', onClick: () => setCreateOpen(true) }}
        />
      )}

      {!isLoading && notices.length > 0 && (
        <div className="space-y-2">
          {notices.map((n) => (
            <NoticeListItem key={n.id} notice={n} canManage />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground py-1.5">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <CreateNoticeDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
