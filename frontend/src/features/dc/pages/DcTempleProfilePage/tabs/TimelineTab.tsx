import {
  CheckCircle2, XCircle, Clock, FileUp, FileX2,
  Send, RefreshCw, MessageSquare, Eye, AlertTriangle,
  Gavel, Milestone, Activity, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { SectionCard } from '../components'
import { useTempleTimeline } from './useTempleTimeline'
import {
  type TempleTimelineEventResponse,
  type TimelineEventCode,
  type TimelineEventVariant,
  resolveTimelineVariant,
  resolveRoleLabel,
  groupTimelineEvents,
} from '@/features/timeline/timelineTypes'

// ── Props ─────────────────────────────────────────────────────────────────────

interface TimelineTabProps {
  templeId: number
}

// ── Icon Map ──────────────────────────────────────────────────────────────────

function TimelineIcon({ code, variant }: { code: string; variant: TimelineEventVariant }) {
  const cls = variantIconClass(variant)
  if (code.endsWith('_APPROVED'))              return <CheckCircle2 size={16} className={cls} />
  if (code.endsWith('_REJECTED'))              return <XCircle size={16} className={cls} />
  if (code.endsWith('_SUBMITTED') || code.endsWith('_RESUBMITTED')) return <Send size={16} className={cls} />
  if (code.endsWith('_UNDER_REVIEW'))          return <Eye size={16} className={cls} />
  if (code.endsWith('_CLARIFICATION_REQUESTED')) return <MessageSquare size={16} className={cls} />
  if (code.endsWith('_CLARIFICATION_RESPONDED')) return <MessageSquare size={16} className={cls} />
  if (code === 'DOCUMENT_UPLOADED')            return <FileUp size={16} className={cls} />
  if (code === 'DOCUMENT_DELETED')             return <FileX2 size={16} className={cls} />
  if (code === 'PROFILE_UPDATED')              return <RefreshCw size={16} className={cls} />
  if (code.startsWith('DECLARATION_SITE_VISIT')) return <Gavel size={16} className={cls} />
  if (code.startsWith('SYSTEM_'))              return <AlertTriangle size={16} className={cls} />
  if (code === 'PROFILE_WITHDRAWN' || code === 'DECLARATION_WITHDRAWN') return <Milestone size={16} className={cls} />
  return <Activity size={16} className={cls} />
}

function variantIconClass(v: TimelineEventVariant): string {
  switch (v) {
    case 'green':  return 'text-emerald-500'
    case 'red':    return 'text-rose-500'
    case 'blue':   return 'text-blue-500'
    case 'purple': return 'text-violet-500'
    case 'orange': return 'text-orange-500'
    default:       return 'text-slate-400'
  }
}

function variantDotClass(v: TimelineEventVariant): string {
  switch (v) {
    case 'green':  return 'bg-emerald-500 ring-emerald-500/20'
    case 'red':    return 'bg-rose-500 ring-rose-500/20'
    case 'blue':   return 'bg-blue-500 ring-blue-500/20'
    case 'purple': return 'bg-violet-500 ring-violet-500/20'
    case 'orange': return 'bg-orange-500 ring-orange-500/20'
    default:       return 'bg-slate-400 ring-slate-400/20'
  }
}

function variantBgClass(v: TimelineEventVariant): string {
  switch (v) {
    case 'green':  return 'bg-emerald-50 dark:bg-emerald-900/20'
    case 'red':    return 'bg-rose-50 dark:bg-rose-900/20'
    case 'blue':   return 'bg-blue-50 dark:bg-blue-900/20'
    case 'purple': return 'bg-violet-50 dark:bg-violet-900/20'
    case 'orange': return 'bg-orange-50 dark:bg-orange-900/20'
    default:       return 'bg-slate-50 dark:bg-slate-800/40'
  }
}

// ── Timestamp ─────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

// ── Single Event Row ──────────────────────────────────────────────────────────

function TimelineEventRow({ event }: { event: TempleTimelineEventResponse }) {
  const variant = resolveTimelineVariant(event.eventCode as TimelineEventCode)

  return (
    <div className="relative flex gap-4 group">
      {/* Vertical line connector (rendered by parent group) */}
      {/* Icon bubble */}
      <div className={`
        relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full
        ring-4 ring-white dark:ring-slate-900 shadow-sm
        ${variantBgClass(variant)}
      `}>
        <TimelineIcon code={event.eventCode} variant={variant} />
      </div>

      {/* Content card */}
      <div className={`
        flex-1 min-w-0 rounded-xl border p-3.5 mb-3
        bg-white dark:bg-slate-900
        border-slate-100 dark:border-slate-800
        hover:border-slate-200 dark:hover:border-slate-700
        transition-all duration-150
      `}>
        {/* Title row */}
        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
          <span className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
            {event.title}
          </span>
          <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
            {formatTimestamp(event.occurredAt)}
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
            {event.description}
          </p>
        )}

        {/* Status transition badge */}
        {event.oldStatus && event.newStatus && (
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono uppercase">
              {event.oldStatus.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-slate-400">→</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold ${statusBadgeClass(event.newStatus)}`}>
              {event.newStatus.replace(/_/g, ' ')}
            </span>
          </div>
        )}

        {/* Comment */}
        {event.comment && (
          <div className="mt-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 px-3 py-2">
            <p className="text-xs italic text-slate-600 dark:text-slate-300">"{event.comment}"</p>
          </div>
        )}

        {/* Footer: performer role */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50 dark:border-slate-800">
          <span className={`
            inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md
            ${roleBadgeClass(event.performerRole)}
          `}>
            <span className={`h-1.5 w-1.5 rounded-full ${variantDotClass(variant)}`} />
            {resolveRoleLabel(event.performerRole)}
          </span>
          {event.moduleName && (
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">
              {event.moduleName.replace(/_/g, ' ')}
            </span>
          )}
          {event.createdBySystem && (
            <span className="text-[10px] text-slate-400 italic">System</span>
          )}
        </div>
      </div>
    </div>
  )
}

function statusBadgeClass(status: string): string {
  const s = status.toUpperCase()
  if (s === 'APPROVED' || s === 'RE_APPROVED') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
  if (s === 'REJECTED')                         return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
  if (s === 'SUBMITTED' || s === 'RESUBMITTED') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
  if (s === 'UNDER_REVIEW')                     return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
  if (s.includes('CLARIFICATION'))              return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case 'DISTRICT_COLLECTOR':
    case 'DC':           return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
    case 'TEMPLE_AUTHORITY':
    case 'TA':           return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'SUPER_ADMIN':  return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
    case 'SYSTEM':       return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
    default:             return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  }
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-full max-w-md" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TimelineTab({ templeId }: TimelineTabProps) {
  const {
    events,
    isLoading,
    isFetchingMore,
    isError,
    hasMore,
    loadMore,
    totalElements,
  } = useTempleTimeline(templeId)

  // Loading state (first page)
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
        <SectionCard title="Activity Timeline" icon={<Clock size={18} />} className="shadow-sm border-slate-200">
          <TimelineSkeleton />
        </SectionCard>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="max-w-3xl mx-auto">
        <SectionCard title="Activity Timeline" icon={<Clock size={18} />} className="shadow-sm border-slate-200">
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-5">
              <AlertTriangle size={32} className="text-red-300" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Unable to load timeline</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px]">
              There was an error fetching the activity timeline. Please refresh the page and try again.
            </p>
          </div>
        </SectionCard>
      </div>
    )
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <SectionCard title="Activity Timeline" icon={<Clock size={18} />} className="shadow-sm border-slate-200">
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
              <Clock size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">No activity yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px]">
              Activity events will appear here as the temple progresses through its lifecycle.
            </p>
          </div>
        </SectionCard>
      </div>
    )
  }

  // Populated state
  const groups = groupTimelineEvents(events)

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <SectionCard
        title={`Activity Timeline`}
        icon={<Clock size={18} />}
        className="shadow-sm border-slate-200"
        action={
          <span className="text-xs text-slate-400 font-medium">
            {totalElements} event{totalElements !== 1 ? 's' : ''}
          </span>
        }
      >
        <div className="space-y-0">
          {groups.map((group) => (
            <div key={group.label} className="mb-6">
              {/* Group header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              </div>

              {/* Events in group — with vertical connector line */}
              <div className="relative pl-0">
                {/* Vertical connector line */}
                {group.events.length > 1 && (
                  <div
                    className="absolute left-[17px] top-9 bottom-3 w-px bg-slate-100 dark:bg-slate-800 z-0"
                    aria-hidden="true"
                  />
                )}

                <div className="space-y-0">
                  {group.events.map((event) => (
                    <TimelineEventRow key={event.id} event={event} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="pt-2 flex justify-center border-t border-slate-50 dark:border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMore}
              disabled={isFetchingMore}
              className="text-xs text-slate-500 hover:text-slate-700 gap-2"
            >
              {isFetchingMore ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
                  Loading…
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  Load more
                </>
              )}
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
