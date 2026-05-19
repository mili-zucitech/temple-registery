import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import {
  DC_TEMPLE_SEARCH_FILTERS,
  getDeclarationFilterStatusLabel,
} from '@/features/dc/declarationStatusFilters'

// ─── Types ───────────────────────────────────────────────────────────────────

const STATUS_KEY = {
  OVERDUE: DC_TEMPLE_SEARCH_FILTERS.OVERDUE,
  PENDING: DC_TEMPLE_SEARCH_FILTERS.PENDING,
  APPROVED: DC_TEMPLE_SEARCH_FILTERS.APPROVED,
} as const

const TRUST_LABELS: Record<string, string> = {
  true:  'Trust: Registered',
  false: 'Trust: Unregistered',
}

export interface ResultsSummaryBarProps {
  /** Total count from current search results (respects active filters). */
  total: number
  /** Number of temples with overdue declarations (from dashboard). */
  overdue: number
  /** Number of temples with pending review declarations (from dashboard). */
  pending: number
  /** Number of temples with approved declarations (from dashboard). */
  declared: number
  /** Show skeleton placeholders while data loads. */
  isLoading: boolean
  /** Currently active declaration status filter (if any). */
  activeStatus: string | undefined
  /** Currently active grade filters (if any). */
  activeGrades: string[] | undefined
  activeDistrictName?: string
  activeTalukName?: string
  activeHobliName?: string
  activeTrust?: boolean
  activeTradition?: string
  activeDeityName?: string
  activeYearFrom?: number
  activeYearTo?: number
  /** Called when a status metric pill is clicked — pass undefined to clear. */
  onStatusClick: (status: string | undefined) => void
}

// ─── Sub-component: Metric pill ───────────────────────────────────────────────

interface MetricPillProps {
  icon: string
  label: string
  count: number
  status: string
  isActive: boolean
  colorClass: string
  activeColorClass: string
  onToggle: () => void
  onClear: () => void
}

function MetricPill({
  icon,
  label,
  count,
  isActive,
  colorClass,
  activeColorClass,
  onToggle,
  onClear,
}: MetricPillProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all duration-150 select-none',
        isActive
          ? cn(activeColorClass, 'shadow-sm')
          : 'bg-card border-border hover:border-primary/40 hover:bg-accent/50 cursor-pointer',
      )}
      role="group"
      aria-label={`${label}: ${count.toLocaleString()}${isActive ? ', filter active' : ''}`}
    >
      <button
        type="button"
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium focus-visible:outline-none',
          isActive ? 'text-inherit' : colorClass,
        )}
        onClick={onToggle}
        aria-pressed={isActive}
        aria-label={isActive ? `Remove ${label} filter` : `Filter by ${label}`}
      >
        <span aria-hidden>{icon}</span>
        <span className="tabular-nums font-bold">{count.toLocaleString()}</span>
        <span className={cn('font-medium', isActive ? 'text-inherit' : 'text-foreground/80')}>{label}</span>
      </button>
      {isActive && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClear() }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Clear ${label} filter`}
        >
          <X size={11} aria-hidden />
        </button>
      )}
    </div>
  )
}

// ─── Sub-component: Total pill (non-interactive) ──────────────────────────────

function TotalPill({ count }: { count: number }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 select-none"
      aria-label={`${count.toLocaleString()} temples found in current view`}
    >
      <span aria-hidden>✅</span>
      <span className="tabular-nums font-bold text-sm text-foreground">{count.toLocaleString()}</span>
      <span className="text-sm font-medium text-foreground/80">
        Temple{count !== 1 ? 's' : ''} Found
      </span>
    </div>
  )
}

// ─── Breadcrumb builder ───────────────────────────────────────────────────────

function buildBreadcrumbs(props: ResultsSummaryBarProps): string[] {
  const parts: string[] = []
  if (props.activeHobliName)    parts.push(`Hobli: ${props.activeHobliName}`)
  else if (props.activeTalukName)  parts.push(`Taluk: ${props.activeTalukName}`)
  else if (props.activeDistrictName) parts.push(`District: ${props.activeDistrictName}`)
  if (props.activeGrades?.length) parts.push(`Grade: ${props.activeGrades.join(', ')}`)
  if (props.activeStatus)        parts.push(`Status: ${getDeclarationFilterStatusLabel(props.activeStatus)}`)
  if (props.activeTrust !== undefined) parts.push(TRUST_LABELS[String(props.activeTrust)])
  if (props.activeTradition)     parts.push(`Tradition: ${props.activeTradition}`)
  if (props.activeDeityName)     parts.push(`Deity: ${props.activeDeityName}`)
  if (props.activeYearFrom !== undefined && props.activeYearTo !== undefined)
    parts.push(`Year: ${props.activeYearFrom}–${props.activeYearTo}`)
  else if (props.activeYearFrom !== undefined) parts.push(`Year from: ${props.activeYearFrom}`)
  else if (props.activeYearTo !== undefined)   parts.push(`Year to: ${props.activeYearTo}`)
  return parts
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Prominent summary bar showing total + status breakdown metrics above the
 * results table. Status pills are clickable to apply/clear the declaration
 * status filter. An active filter breadcrumb is shown below the pills.
 */
export function ResultsSummaryBar(props: ResultsSummaryBarProps) {
  const {
    total,
    overdue,
    pending,
    declared,
    isLoading,
    activeStatus,
    onStatusClick,
  } = props

  const breadcrumbs = buildBreadcrumbs(props)
  const hasBreadcrumb = breadcrumbs.length > 0

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-2.5">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-36 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        <Skeleton className="h-3 w-64" />
      </div>
    )
  }

  return (
    <div
      className="rounded-lg border border-border bg-card px-4 py-3 space-y-2.5"
      role="region"
      aria-label="Results summary"
    >
      {/* Metric pills row */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by declaration status">
        <TotalPill count={total} />

        <MetricPill
          icon="🔴"
          label="Overdue"
          count={overdue}
          status={STATUS_KEY.OVERDUE}
          isActive={activeStatus === STATUS_KEY.OVERDUE}
          colorClass="text-destructive"
          activeColorClass="bg-destructive border-transparent text-white"
          onToggle={() => onStatusClick(activeStatus === STATUS_KEY.OVERDUE ? undefined : STATUS_KEY.OVERDUE)}
          onClear={() => onStatusClick(undefined)}
        />

        <MetricPill
          icon="🟠"
          label="Pending"
          count={pending}
          status={STATUS_KEY.PENDING}
          isActive={activeStatus === STATUS_KEY.PENDING}
          colorClass="text-amber-600"
          activeColorClass="bg-amber-500 border-transparent text-white"
          onToggle={() => onStatusClick(activeStatus === STATUS_KEY.PENDING ? undefined : STATUS_KEY.PENDING)}
          onClear={() => onStatusClick(undefined)}
        />

        <MetricPill
          icon="🟢"
          label="Declared"
          count={declared}
          status={STATUS_KEY.APPROVED}
          isActive={activeStatus === STATUS_KEY.APPROVED}
          colorClass="text-emerald-700"
          activeColorClass="bg-emerald-600 border-transparent text-white"
          onToggle={() => onStatusClick(activeStatus === STATUS_KEY.APPROVED ? undefined : STATUS_KEY.APPROVED)}
          onClear={() => onStatusClick(undefined)}
        />
      </div>

      {/* Active filter breadcrumb */}
      {hasBreadcrumb && (
        <p
          className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap"
          aria-live="polite"
          aria-label="Active filters"
        >
          <span className="font-medium text-foreground/60 uppercase tracking-wide text-[10px]">Filters:</span>
          {breadcrumbs.map((part, i) => (
            <span key={part} className="flex items-center gap-1">
              {i > 0 && <span className="text-border" aria-hidden>•</span>}
              <span className="text-foreground/80 font-medium">{part}</span>
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
