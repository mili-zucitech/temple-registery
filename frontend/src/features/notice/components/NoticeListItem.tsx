import { useState } from 'react'
import { format } from 'date-fns'
import { Archive, Edit, MoreHorizontal, Pin, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog'
import { NoticeStatusBadge, NoticePriorityBadge } from './NoticeBadges'
import { NoticePreviewModal } from './NoticePreviewModal'
import type { NoticeListItemResponse } from '../noticeTypes'
import { useChangeNoticeStatus, useDeleteNotice } from '../noticeHooks'
import { cn } from '@/lib/utils'

interface NoticeListItemProps {
  notice: NoticeListItemResponse
  onEdit?: (notice: NoticeListItemResponse) => void
  canManage?: boolean
}

export function NoticeListItem({ notice, onEdit, canManage }: NoticeListItemProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { changeStatus } = useChangeNoticeStatus()
  const { deleteNotice, isLoading: isDeleting } = useDeleteNotice()

  const priorityBorder: Record<string, string> = {
    HIGH: 'border-l-red-500',
    MEDIUM: 'border-l-amber-400',
    LOW: 'border-l-gray-300',
  }

  return (
    <>
      <div
        className={cn(
          'flex items-start justify-between gap-4 rounded-md border border-l-4 bg-card px-4 py-3 cursor-pointer transition-colors hover:bg-accent/30',
          priorityBorder[notice.priority] ?? 'border-l-gray-300',
          !notice.read && 'bg-blue-50/30',
        )}
        onClick={() => setPreviewOpen(true)}
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {notice.pinned && <Pin size={12} className="text-primary shrink-0" />}
            {!notice.read && (
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 shrink-0" title="Unread" />
            )}
            <p className="text-sm font-medium truncate">{notice.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NoticeStatusBadge status={notice.status} />
            <NoticePriorityBadge priority={notice.priority} />
            {notice.scope === 'GLOBAL' && (
              <span className="text-xs text-purple-700 font-medium">Global</span>
            )}
            {notice.districtName && (
              <span className="text-xs text-muted-foreground">{notice.districtName}</span>
            )}
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            {notice.publishedAt && (
              <span>{format(new Date(notice.publishedAt), 'dd MMM yyyy')}</span>
            )}
            {notice.expiryDate && (
              <span>Expires {format(new Date(notice.expiryDate), 'dd MMM yyyy')}</span>
            )}
            {notice.attachmentCount > 0 && (
              <span>{notice.attachmentCount} attachment{notice.attachmentCount > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={15} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(notice)
                  }}
                >
                  <Edit size={14} className="mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {notice.status === 'DRAFT' && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    changeStatus(notice.id, { targetStatus: 'PUBLISHED' })
                  }}
                >
                  Publish
                </DropdownMenuItem>
              )}
              {notice.status === 'PUBLISHED' && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    changeStatus(notice.id, { targetStatus: 'ARCHIVED' })
                  }}
                >
                  <Archive size={14} className="mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteOpen(true)
                }}
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <NoticePreviewModal
        noticeId={notice.id}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Notice"
        description="This notice will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => deleteNotice(notice.id)}
      />
    </>
  )
}
