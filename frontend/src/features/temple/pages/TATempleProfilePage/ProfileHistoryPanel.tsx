import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TempleProfileStagingResponse } from '@/features/temple/templeTypes'

interface ProfileHistoryPanelProps {
  items: TempleProfileStagingResponse[]
  isLoading: boolean
}

function fmtDate(iso: string | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const STATUS_CFG: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
  APPROVED: {
    icon: <CheckCircle2 size={14} className="text-success" />,
    cls: 'bg-success/10 text-success border-success/20',
    label: 'Approved',
  },
  REJECTED: {
    icon: <XCircle size={14} className="text-destructive" />,
    cls: 'bg-destructive/10 text-destructive border-destructive/20',
    label: 'Rejected',
  },
  SUBMITTED: {
    icon: <Clock size={14} className="text-info" />,
    cls: 'bg-info/10 text-info border-info/20',
    label: 'Submitted',
  },
  PENDING_REVIEW: {
    icon: <Clock size={14} className="text-info" />,
    cls: 'bg-info/10 text-info border-info/20',
    label: 'Submitted',
  },
  DRAFT: {
    icon: <Clock size={14} className="text-warning" />,
    cls: 'bg-warning/10 text-warning border-warning/20',
    label: 'Draft',
  },
  SUPERSEDED: {
    icon: <CheckCircle2 size={14} className="text-muted-foreground" />,
    cls: 'bg-muted text-muted-foreground border-border',
    label: 'Superseded',
  },
}

function getStatusCfg(statusLabel: string) {
  return STATUS_CFG[statusLabel] ?? STATUS_CFG['DRAFT']
}

export function ProfileHistoryPanel({ items, isLoading }: ProfileHistoryPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock size={36} className="text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-foreground">No history yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Previous profile versions will appear here after submission.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        Submission History
      </p>
      {items.map((item) => {
        const cfg = getStatusCfg(item.statusLabel)
        return (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-xl border border-border px-4 py-3.5 hover:bg-muted/20 transition-colors"
          >
            {/* Version + status */}
            <div className="flex-shrink-0 w-16 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Version</p>
              <p className="text-lg font-bold text-foreground leading-tight">{item.versionNumber}</p>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-1.5 min-w-[110px]">
              {cfg.icon}
              <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', cfg.cls)}>
                {cfg.label}
              </span>
            </div>

            {/* Contact person */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {item.contactPersonName ?? 'Profile update'}
              </p>
              {item.contactPersonDesignation && (
                <p className="text-[11px] text-muted-foreground truncate">{item.contactPersonDesignation}</p>
              )}
            </div>

            {/* Dates */}
            <div className="flex-shrink-0 text-right">
              <p className="text-[11px] text-muted-foreground">
                {item.submittedAt ? `Submitted ${fmtDate(item.submittedAt)}` : `Created ${fmtDate(item.createdAt)}`}
              </p>
              {item.reviewedAt && (
                <p className="text-[11px] text-muted-foreground">Reviewed {fmtDate(item.reviewedAt)}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
