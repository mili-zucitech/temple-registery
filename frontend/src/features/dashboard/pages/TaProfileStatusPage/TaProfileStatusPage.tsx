import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import { useGetStagingHistoryQuery } from '@/features/temple-profile/hooks/templeApi'
import type { TempleProfileStagingResponse } from '@/features/temple-profile/hooks/templeTypes'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { ROUTE_PATHS } from '@/constants/routePaths'
import {
  CheckCircle2, XCircle, Clock, FileEdit, ChevronDown, ChevronUp, ArrowLeft,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0 },
}

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatDateTime(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function stepIcon(status: string) {
  switch (status) {
    case 'APPROVED':    return <CheckCircle2 size={20} className="text-success" />
    case 'REJECTED':    return <XCircle size={20} className="text-destructive" />
    case 'SUBMITTED':   return <Clock size={20} className="text-info" />
    case 'SUPERSEDED':  return <FileEdit size={20} className="text-muted-foreground" />
    default:            return <FileEdit size={20} className="text-muted-foreground" />
  }
}

function connectorColor(status: string) {
  switch (status) {
    case 'APPROVED':   return 'bg-success/30'
    case 'REJECTED':   return 'bg-destructive/30'
    case 'SUBMITTED':  return 'bg-info/30'
    default:           return 'bg-border'
  }
}

interface TimelineItemProps {
  record: TempleProfileStagingResponse
  isLast: boolean
}

function TimelineItem({ record, isLast }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(record.statusLabel === 'REJECTED')

  const isApproved = record.statusLabel === 'APPROVED'
  const isRejected = record.statusLabel === 'REJECTED'
  const hasDetail  = !!record.reviewComment

  return (
    <div className="flex gap-4">
      {/* Spine */}
      <div className="flex flex-col items-center">
        <div className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2',
          isApproved && 'border-success bg-success/10',
          isRejected && 'border-destructive bg-destructive/10',
          !isApproved && !isRejected && 'border-border bg-muted',
        )}>
          {stepIcon(record.statusLabel)}
        </div>
        {!isLast && (
          <div className={cn('mt-1 w-0.5 flex-1 min-h-[2rem]', connectorColor(record.statusLabel))} />
        )}
      </div>

      {/* Card */}
      <div className={cn(
        'mb-6 flex-1 rounded-lg border bg-card px-5 py-4 shadow-soft-sm transition-shadow hover:shadow-soft-md',
        isApproved && 'border-success/30',
        isRejected && 'border-destructive/30',
        !isApproved && !isRejected && 'border-border',
      )}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Version {record.versionNumber}
              </span>
              <StatusBadge status={record.statusLabel} />
              {isApproved && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-success border border-success/30 rounded px-1.5 py-0.5 bg-success/5">
                  Current
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
              {record.submittedAt && (
                <span>Submitted: {formatDateTime(record.submittedAt)}</span>
              )}
              {record.reviewedAt && (
                <span>Reviewed: {formatDate(record.reviewedAt)}</span>
              )}
              {!record.submittedAt && (
                <span>Created: {formatDate(record.createdAt)}</span>
              )}
            </div>
          </div>

          {hasDetail && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex flex-shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'Hide' : 'Details'}
            </button>
          )}
        </div>

        {/* Expandable DC comment */}
        {hasDetail && expanded && (
          <div className={cn(
            'mt-4 rounded-md border px-4 py-3 text-sm',
            isRejected
              ? 'border-destructive/30 bg-destructive/5 text-destructive'
              : 'border-border bg-muted/40 text-foreground',
          )}>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1 opacity-70">
              DC Remarks
            </p>
            <p>{record.reviewComment}</p>
          </div>
        )}

        {/* Profile data summary (only for submitted/approved records) */}
        {(record.statusLabel === 'SUBMITTED' || record.statusLabel === 'APPROVED') && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border pt-3">
            {record.contactPersonName && (
              <span><span className="font-medium text-foreground/70">Contact:</span> {record.contactPersonName}</span>
            )}
            {record.languagesOfWorship && (
              <span><span className="font-medium text-foreground/70">Languages:</span> {record.languagesOfWorship}</span>
            )}
            {record.annualFestivals && (
              <span className="col-span-full"><span className="font-medium text-foreground/70">Festivals:</span> {record.annualFestivals}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function TaProfileStatusPage() {
  const navigate = useNavigate()

  const { data: userData, isLoading: userLoading } = useGetCurrentUserQuery()
  const templeId = userData?.data?.templeId

  const { data: historyData, isLoading: historyLoading } = useGetStagingHistoryQuery(
    { templeId: templeId!, page: 0, size: 20 },
    { skip: !templeId }
  )

  const isLoading = userLoading || historyLoading
  const records: TempleProfileStagingResponse[] = historyData?.data?.content ?? []

  return (
    <motion.div
      className="space-y-6 max-w-3xl"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate(ROUTE_PATHS.TA_DASHBOARD)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Profile Submission History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all profile submissions sent to the District Collector for review.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(ROUTE_PATHS.TA_TEMPLE)}
        >
          Edit Profile
        </Button>
      </motion.div>

      {/* Status legend */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-success" /> Approved</span>
        <span className="flex items-center gap-1"><XCircle size={13} className="text-destructive" /> Rejected</span>
        <span className="flex items-center gap-1"><Clock size={13} className="text-info" /> Under Review</span>
        <span className="flex items-center gap-1"><FileEdit size={13} className="text-muted-foreground" /> Draft / Superseded</span>
      </motion.div>

      {/* Timeline */}
      <motion.div variants={fadeUp}>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  {i < 2 && <div className="mt-1 w-0.5 h-20 bg-muted animate-pulse" />}
                </div>
                <div className="flex-1 mb-6">
                  <CardSkeleton />
                </div>
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            description="Complete and submit your temple profile to start the DC review process."
            icon={<FileEdit size={44} />}
            action={{ label: 'Go to Temple Profile', onClick: () => navigate(ROUTE_PATHS.TA_TEMPLE) }}
          />
        ) : (
          <div>
            {records.map((record, idx) => (
              <TimelineItem
                key={record.id}
                record={record}
                isLast={idx === records.length - 1}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
