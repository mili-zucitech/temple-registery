import { Download, Eye, Paperclip, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NoticeAttachmentResponse } from '../noticeTypes'

interface NoticeAttachmentListProps {
  noticeId: number
  attachments: NoticeAttachmentResponse[]
  canDelete?: boolean
  onRemove?: (attachmentId: number) => void
  isRemoving?: boolean
}

export function NoticeAttachmentList({
  noticeId,
  attachments,
  canDelete,
  onRemove,
  isRemoving,
}: NoticeAttachmentListProps) {
  if (attachments.length === 0) return null

  const openUrl = (url: string) => window.open(url, '_blank', 'noopener,noreferrer')

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        <Paperclip size={12} />
        Attachments ({attachments.length})
      </p>
      {attachments.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 gap-2"
        >
          <span className="text-sm truncate max-w-[220px]" title={a.originalFilename}>
            {a.originalFilename}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => openUrl(a.previewUrl)}
              title="Preview"
            >
              <Eye size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => openUrl(a.downloadUrl)}
              title="Download"
            >
              <Download size={14} />
            </Button>
            {canDelete && onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onRemove(a.id)}
                disabled={isRemoving}
                title="Remove"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
