import { ChevronLeft, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DcTempleSearchItemResponse } from '@/features/dc/dcTypes'

interface TempleTableProps {
  temples: DcTempleSearchItemResponse[]
  isLoading: boolean
  isError: boolean
  isFetching?: boolean
  page: number
  totalPages: number
  hasActiveFilters?: boolean
  onView: (templeId: number) => void
  onPageChange: (page: number) => void
  onClearFilters?: () => void
}

/**
 * Paginated, district-scoped DC temple results table.
 *
 * Handles loading (TableSkeleton), error (EmptyState with retry), and
 * empty (EmptyState with optional clear-filters action) states.
 * Rendering of data, filtering, and pagination state is driven by props —
 * no data-fetching occurs inside this component.
 */
export function TempleTable({
  temples,
  isLoading,
  isError,
  isFetching = false,
  page,
  totalPages,
  hasActiveFilters = false,
  onView,
  onPageChange,
  onClearFilters,
}: TempleTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <TableSkeleton rows={8} />
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to load temples"
        description="Unable to retrieve temple data. Please try again."
        action={{ label: 'Retry', onClick: () => window.location.reload() }}
      />
    )
  }

  if (temples.length === 0) {
    return (
      <EmptyState
        title="No temples found"
        description={
          hasActiveFilters
            ? 'No temples match your current filters.'
            : 'No temples are registered in your district yet.'
        }
        action={
          hasActiveFilters && onClearFilters
            ? { label: 'Clear filters', onClick: onClearFilters }
            : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className={cn('rounded-lg border border-border bg-card overflow-hidden', isFetching && 'opacity-60 transition-opacity')}>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Temple</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Grade</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Declaration Status</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Pending</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Overdue</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden lg:table-cell">Trust</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {temples.map((temple) => (
              <tr
                key={temple.templeId}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <span className="font-medium text-foreground">{temple.name}</span>
                    {temple.registrationNumber && (
                      <p className="text-xs text-muted-foreground mt-0.5">{temple.registrationNumber}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold">{temple.grade}</span>
                </td>
                <td className="px-4 py-3">
                  {temple.assetDeclarationStatus ? (
                    <StatusBadge status={temple.assetDeclarationStatus} />
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <CountCell value={temple.pendingDeclarations} warnColor="text-warning" />
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <CountCell value={temple.overdueDeclarations} warnColor="text-destructive" />
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {temple.hasActiveTrust ? (
                    <span className="text-success text-xs font-medium">Yes</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">No</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(temple.templeId)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || isFetching}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft size={16} />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1 || isFetching}
              onClick={() => onPageChange(page + 1)}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function CountCell({ value, warnColor }: { value: number; warnColor: string }) {
  return value > 0 ? (
    <span className={`font-semibold ${warnColor}`}>{value}</span>
  ) : (
    <span className="text-muted-foreground">0</span>
  )
}
