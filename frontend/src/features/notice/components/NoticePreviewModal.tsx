import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useGetNoticeByIdQuery } from '../noticeApi'
import { NoticeStatusBadge, NoticePriorityBadge } from './NoticeBadges'
import { NoticeAttachmentList } from './NoticeAttachmentList'
import { Pin } from 'lucide-react'

interface NoticePreviewModalProps {
  noticeId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NoticePreviewModal({ noticeId, open, onOpenChange }: NoticePreviewModalProps) {
  const { data, isLoading } = useGetNoticeByIdQuery(noticeId!, { skip: !noticeId || !open })
  const notice = data?.data

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {notice?.pinned && <Pin size={14} className="text-primary shrink-0" />}
            <span>{notice?.title ?? 'Loading…'}</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {notice && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <NoticeStatusBadge status={notice.status} />
              <NoticePriorityBadge priority={notice.priority} />
              {notice.scope === 'GLOBAL' && (
                <span className="inline-flex items-center rounded-sm border border-purple-200 bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 uppercase">
                  Global
                </span>
              )}
              {notice.districtName && (
                <span className="text-xs text-muted-foreground">{notice.districtName}</span>
              )}
            </div>

            <div className="flex gap-4 text-xs text-muted-foreground">
              {notice.publishedAt && (
                <span>Published: {new Date(notice.publishedAt).toLocaleDateString()}</span>
              )}
              {notice.expiryDate && (
                <span>Expires: {new Date(notice.expiryDate).toLocaleDateString()}</span>
              )}
              {notice.createdByName && <span>By: {notice.createdByName}</span>}
            </div>

            <Separator />

            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{notice.body}</p>

            {notice.attachments.length > 0 && (
              <>
                <Separator />
                <NoticeAttachmentList
                  noticeId={notice.id}
                  attachments={notice.attachments}
                  canDelete={false}
                />
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
