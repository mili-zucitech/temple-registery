import { useNavigate } from 'react-router-dom'
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { useDcTempleSearch } from '@/features/dc/dcHooks'
import type { DcTempleSearchItemResponse } from '@/features/dc/dcTypes'

const GRADES = ['A', 'B', 'C'] as const
const TRADITIONS = [
  'SHAIVITE', 'VAISHNAVITE', 'SHAKTA', 'JAIN', 'BUDDHIST', 'OTHER',
] as const
const DECLARATION_STATUSES = [
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'CLARIFICATION_REQUESTED',
  'PHYSICAL_VERIFICATION_REQUESTED',
  'OVERDUE',
] as const

export function DcTempleSearchPage() {
  const navigate = useNavigate()
  const {
    temples,
    total,
    totalPages,
    filters,
    page,
    isLoading,
    isError,
    isFetching,
    applyFilters,
    clearFilters,
    goToPage,
  } = useDcTempleSearch()

  const hasActiveFilters =
    filters.keyword ||
    filters.grade?.length ||
    filters.tradition ||
    filters.declarationStatus ||
    filters.trustRegistered !== undefined

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Temples</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total > 0 ? `${total} temples found` : 'Search temples in your district'}
        </p>
      </div>

      {/* Filter panel */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        {/* Search row */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              className="pl-9"
              placeholder="Search by name, deity, registration number…"
              defaultValue={filters.keyword ?? ''}
              onChange={(e) => applyFilters({ keyword: e.target.value || undefined })}
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
              <X size={14} />
              Clear
            </Button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-3">
          <Select
            value={filters.grade?.[0] ?? ''}
            onValueChange={(v) => applyFilters({ grade: v ? [v] : undefined })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All grades</SelectItem>
              {GRADES.map((g) => (
                <SelectItem key={g} value={g}>Grade {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.tradition ?? ''}
            onValueChange={(v) => applyFilters({ tradition: v || undefined })}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Tradition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All traditions</SelectItem>
              {TRADITIONS.map((t) => (
                <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.declarationStatus ?? ''}
            onValueChange={(v) => applyFilters({ declarationStatus: v || undefined })}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Declaration status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {DECLARATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={
              filters.trustRegistered === true
                ? 'true'
                : filters.trustRegistered === false
                  ? 'false'
                  : ''
            }
            onValueChange={(v) =>
              applyFilters({
                trustRegistered: v === 'true' ? true : v === 'false' ? false : undefined,
              })
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Trust registered" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
              <SelectItem value="true">Trust registered</SelectItem>
              <SelectItem value="false">Not registered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={8} />
          </div>
        ) : isError ? (
          <EmptyState
            title="Failed to load temples"
            description="Unable to retrieve temple data. Please try again."
            action={{ label: 'Retry', onClick: () => window.location.reload() }}
          />
        ) : temples.length === 0 ? (
          <EmptyState
            title="No temples found"
            description="Try adjusting your search filters."
            action={hasActiveFilters ? { label: 'Clear filters', onClick: clearFilters } : undefined}
          />
        ) : (
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
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
                  <TempleRow
                    key={temple.templeId}
                    temple={temple}
                    onView={() =>
                      navigate(
                        ROUTE_PATHS.DC_TEMPLE_DETAIL.replace(':templeId', String(temple.templeId)),
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || isFetching}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft size={16} />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1 || isFetching}
              onClick={() => goToPage(page + 1)}
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

// ─── Sub-component ────────────────────────────────────────────────────────────

interface TempleRowProps {
  temple: DcTempleSearchItemResponse
  onView: () => void
}

function TempleRow({ temple, onView }: TempleRowProps) {
  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div>
          <span className="font-medium text-foreground">{temple.name}</span>
          {temple.registrationNumber && (
            <p className="text-xs text-muted-foreground mt-0.5">{temple.registrationNumber}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-semibold text-foreground">{temple.grade}</span>
      </td>
      <td className="px-4 py-3">
        {temple.assetDeclarationStatus ? (
          <StatusBadge status={temple.assetDeclarationStatus} />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {temple.pendingDeclarations > 0 ? (
          <span className="font-semibold text-warning">{temple.pendingDeclarations}</span>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {temple.overdueDeclarations > 0 ? (
          <span className="font-semibold text-destructive">{temple.overdueDeclarations}</span>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {temple.hasActiveTrust ? (
          <span className="text-success text-xs font-medium">Yes</span>
        ) : (
          <span className="text-muted-foreground text-xs">No</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <Button variant="ghost" size="sm" onClick={onView}>
          View
        </Button>
      </td>
    </tr>
  )
}
