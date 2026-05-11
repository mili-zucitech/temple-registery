import { Clock, CheckCircle2, XCircle, RotateCcw, Send, AlertCircle } from 'lucide-react'
import { useDcProfileHistory } from '@/features/dc/dcHooks'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import type { DcProfileHistoryEntry } from '@/features/dc/dcTypes'

interface ProfileHistoryTabProps {
  templeId: number
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function VersionBadge({ status }: { status: string }) {
  const isApproved = status === 'APPROVED' || status === 'RE_APPROVED'
  const isRejected = status === 'REJECTED'
  const isSubmitted = status === 'SUBMITTED' || status === 'RESUBMITTED' || status === 'UNDER_REVIEW'

  if (isApproved) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 size={11} />
        {status === 'RE_APPROVED' ? 'Re-Approved' : 'Approved'}
      </span>
    )
  }
  if (isRejected) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
        <XCircle size={11} />
        Rejected
      </span>
    )
  }
  if (isSubmitted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <Send size={11} />
        {status === 'RESUBMITTED' ? 'Resubmitted' : status === 'UNDER_REVIEW' ? 'Under Review' : 'Submitted'}
      </span>
    )
  }
  return <StatusBadge status={status} />
}

function HistoryRowSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 border-b border-slate-800/50">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full shrink-0" />
    </div>
  )
}

function HistoryRow({ entry }: { entry: DcProfileHistoryEntry }) {
  const isApproved = entry.status === 'APPROVED' || entry.status === 'RE_APPROVED'
  const isRejected = entry.status === 'REJECTED'

  return (
    <div className="flex items-start gap-4 p-4 border-b border-slate-800/30 last:border-0 hover:bg-slate-800/20 transition-colors">
      {/* Version badge */}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border
        ${isApproved ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          : isRejected ? 'bg-red-500/20 border-red-500/40 text-red-400'
          : 'bg-amber-500/20 border-amber-500/40 text-amber-400'}`}>
        v{entry.versionNumber}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-100">Version {entry.versionNumber}</span>
          <VersionBadge status={entry.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Send size={11} className="text-slate-500 shrink-0" />
            <span>Submitted: {fmt(entry.submittedAt)}</span>
          </div>
          {entry.reviewedAt && (
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-slate-500 shrink-0" />
              <span>Reviewed: {fmt(entry.reviewedAt)}</span>
            </div>
          )}
        </div>

        {entry.reviewComment && (
          <div className={`mt-2 p-2.5 rounded-lg text-xs border ${
            isRejected
              ? 'bg-red-500/10 border-red-500/20 text-red-300'
              : 'bg-slate-700/40 border-slate-600/30 text-slate-300'
          }`}>
            <div className="flex items-start gap-1.5">
              <AlertCircle size={11} className="mt-0.5 shrink-0 opacity-70" />
              <span className="leading-relaxed">{entry.reviewComment}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ProfileHistoryTab({ templeId }: ProfileHistoryTabProps) {
  const { history, total, isLoading, isError } = useDcProfileHistory(templeId)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-orange-400" />
            <h3 className="text-sm font-semibold text-slate-100">Profile Submission History</h3>
            {!isLoading && total > 0 && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-md bg-slate-700 text-slate-400 border border-slate-600">
                {total} {total === 1 ? 'version' : 'versions'}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="divide-y divide-slate-800/30">
          {isLoading ? (
            <>
              <HistoryRowSkeleton />
              <HistoryRowSkeleton />
              <HistoryRowSkeleton />
            </>
          ) : isError ? (
            <div className="p-6">
              <EmptyState
                title="Failed to load history"
                description="Unable to retrieve profile history. Please refresh and try again."
                icon={<AlertCircle className="text-red-400" />}
              />
            </div>
          ) : history.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No history yet"
                description="No profile submissions have been made for this temple yet."
                icon={<RotateCcw className="text-slate-500" />}
              />
            </div>
          ) : (
            history.map((entry) => (
              <HistoryRow key={entry.stagingId} entry={entry} />
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      {!isLoading && history.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={11} className="text-emerald-400" /> Approved
          </span>
          <span className="flex items-center gap-1.5">
            <XCircle size={11} className="text-red-400" /> Rejected
          </span>
          <span className="flex items-center gap-1.5">
            <Send size={11} className="text-amber-400" /> Submitted / Under Review
          </span>
        </div>
      )}
    </div>
  )
}
