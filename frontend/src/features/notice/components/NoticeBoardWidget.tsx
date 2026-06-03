import { useState } from 'react'
import { Bell, Pin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { NoticePriorityBadge } from './NoticeBadges'
import { NoticePreviewModal } from './NoticePreviewModal'
import { useNoticeDashboard } from '../noticeHooks'
import { cn } from '@/lib/utils'
import type { NoticeListItemResponse } from '../noticeTypes'

const PRIORITY_BORDER: Record<string, string> = {
  HIGH:   'border-l-red-500',
  MEDIUM: 'border-l-amber-400',
  LOW:    'border-l-gray-300',
}

function NoticeCard({ notice, onClick }: { notice: NoticeListItemResponse; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        'w-full text-left flex items-start gap-3 rounded-md border border-l-4 px-3 py-2 bg-card hover:bg-accent/30 transition-colors',
        PRIORITY_BORDER[notice.priority] ?? 'border-l-gray-300',
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5">
          {notice.pinned && <Pin size={11} className="text-primary shrink-0" />}
          {!notice.read && (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
          )}
          <p className="text-sm font-medium truncate">{notice.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <NoticePriorityBadge priority={notice.priority} />
          {notice.publishedAt && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notice.publishedAt), { addSuffix: true })}
            </span>
          )}
          {notice.attachmentCount > 0 && (
            <span className="text-xs text-muted-foreground">📎 {notice.attachmentCount}</span>
          )}
        </div>
      </div>
    </button>
  )
}

export function NoticeBoardWidget() {
  const { notices, unreadCount, isLoading } = useNoticeDashboard()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Bell size={16} />
              Notice Board
            </div>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 w-full animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          )}

          {!isLoading && notices.length === 0 && (
            <EmptyState
              title="No active notices"
              description="No notices from your district at this time."
              icon={<Bell size={32} />}
            />
          )}

          {!isLoading &&
            notices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onClick={() => setSelectedId(notice.id)}
              />
            ))}
        </CardContent>
      </Card>

      <NoticePreviewModal
        noticeId={selectedId}
        open={selectedId !== null}
        onOpenChange={(open) => { if (!open) setSelectedId(null) }}
      />
    </>
  )
}
