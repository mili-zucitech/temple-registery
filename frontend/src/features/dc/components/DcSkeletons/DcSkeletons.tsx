import { Skeleton } from '@/components/feedback/Skeleton/Skeleton'

/** Skeleton for a single KPI card in the DC dashboard. */
export function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

/** Row of 5 KPI card skeletons for the DC dashboard overview grid. */
export function DashboardKpiSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Skeleton row for a temple table entry. */
export function TempleRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-28 rounded-sm" /></td>
      <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-6" /></td>
      <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-6" /></td>
      <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-8" /></td>
      <td className="px-4 py-3"><Skeleton className="h-7 w-14 ml-auto" /></td>
    </tr>
  )
}

/** Skeleton for the full temple results table (header + rows). */
export function TempleTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            {['Temple', 'Grade', 'Status', 'Pending', 'Overdue', 'Trust', ''].map((h) => (
              <th key={h} className="px-4 py-3 text-left">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <TempleRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Skeleton for the notification list. */
export function NotificationListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border bg-card divide-y divide-border">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-24" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3 flex items-start gap-3">
          <Skeleton className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Skeleton for the temple profile page header block. */
export function TempleProfileHeaderSkeleton() {
  return (
    <div className="flex items-start gap-4">
      <Skeleton className="h-8 w-8 rounded-md flex-shrink-0 mt-1" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-7 w-64" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-28 rounded-sm" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton that mirrors the GovernanceActionPanel layout:
 * header row → status info box → approve/reject buttons.
 */
export function GovernanceActionPanelSkeleton() {
  return (
    <div className="bg-white p-5 space-y-4 flex flex-col rounded-xl border border-border/50">
      {/* Header: icon + title + status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-7 w-28 rounded-lg" />
      </div>
      {/* Status info box */}
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
    </div>
  )
}

/**
 * Skeleton for the governance section card in the Overview tab (temple profile module).
 * Wraps GovernanceActionPanelSkeleton with the same container styling.
 */
export function ProfileGovernanceSectionSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-border/50 shadow-md bg-white">
      <GovernanceActionPanelSkeleton />
    </div>
  )
}

/**
 * Skeleton for the Trust tab — mirrors SectionCard "Trust Registration" layout
 * plus the GovernanceActionPanel at the bottom.
 */
export function TrustSectionSkeleton() {
  return (
    <section className="bg-card border border-border rounded-xl shadow-sm flex flex-col animate-in fade-in duration-300">
      {/* SectionCard header */}
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between bg-muted/5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      {/* Content */}
      <div className="p-5 space-y-6">
        {/* Trust details grid — 9 fields matching the real layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
        {/* Governance panel skeleton */}
        <div className="pt-4 border-t border-border/40">
          <GovernanceActionPanelSkeleton />
        </div>
      </div>
    </section>
  )
}

/**
 * Skeleton for the "Review outcomes" action card in DcDeclarationDetailPage.
 * Mirrors the card with 4 action buttons shown when canAct && actionable.
 */
export function DeclarationActionCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 shadow-soft-md overflow-hidden animate-in fade-in duration-300">
      <div className="px-6 py-4 border-b border-border/50 space-y-1.5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      <div className="p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
