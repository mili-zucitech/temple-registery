import { memo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Building2, MapPin, RotateCcw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { useAppSelector } from '@/app/store'
import { usePublicTempleSearch } from '@/features/search/usePublicTempleSearch'
import { useGetDistrictsByStateQuery } from '@/features/geo/geoApi'
import type { TempleSearchResultResponse } from '@/features/temple-profile/hooks/templeTypes'

const GRADES = ['A', 'B', 'C'] as const

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  B: 'bg-amber-100 text-amber-700 border border-amber-200',
  C: 'bg-orange-100 text-orange-700 border border-orange-200',
}

const GRADE_SELECTED_COLORS: Record<string, string> = {
  A: 'bg-emerald-600 hover:bg-emerald-700 border-transparent text-white',
  B: 'bg-amber-500 hover:bg-amber-600 border-transparent text-white',
  C: 'bg-orange-500 hover:bg-orange-600 border-transparent text-white',
}

// ─── Temple Card ──────────────────────────────────────────────────────────────

interface TempleCardProps {
  temple: TempleSearchResultResponse
  isOwn: boolean
  onViewEdit: (temple: TempleSearchResultResponse) => void
}

const TempleCard = memo(function TempleCard({ temple, isOwn, onViewEdit }: TempleCardProps) {
  const gradeColor = GRADE_COLORS[temple.grade] ?? 'bg-slate-100 text-slate-700'

  return (
    <div className={cn(
      'group bg-white rounded-xl border hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col',
      isOwn ? 'border-primary/40 ring-2 ring-primary/20' : 'border-slate-200',
    )}>
      {isOwn && (
        <div className="bg-primary/5 border-b border-primary/20 px-3 py-1 text-center">
          <span className="text-xs font-semibold text-primary">Your Temple</span>
        </div>
      )}
      <div className="h-32 bg-gradient-to-br from-amber-50 to-orange-100 relative overflow-hidden flex-shrink-0">
        {temple.photoUrl ? (
          <img
            src={temple.photoUrl}
            alt={temple.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 size={36} className="text-amber-300" />
          </div>
        )}
        <span className={cn('absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold', gradeColor)}>
          Grade {temple.grade}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm leading-tight">{temple.name}</h3>
        {temple.primaryDeity && (
          <p className="text-xs text-slate-500"><span className="font-medium">Deity:</span> {temple.primaryDeity}</p>
        )}
        {temple.districtName && (
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <MapPin size={11} className="text-slate-400" />{temple.districtName}
          </p>
        )}
        <div className="mt-auto pt-2">
          <Button
            size="sm"
            variant={isOwn ? 'default' : 'outline'}
            className="w-full text-xs h-8"
            onClick={() => onViewEdit(temple)}
          >
            {isOwn ? 'View & Edit' : 'View'}
          </Button>
        </div>
      </div>
    </div>
  )
})

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TaTempleSearchPage() {
  const navigate = useNavigate()
  const currentUser = useAppSelector((s) => s.auth.currentUser)
  const myTempleId = currentUser?.templeId

  const {
    temples,
    total,
    totalPages,
    filters,
    page,
    isLoading,
    isFetching,
    isError,
    localKeyword,
    setLocalKeyword,
    localDeityName,
    setLocalDeityName,
    applyFilters,
    clearFilters,
    goToPage,
  } = usePublicTempleSearch()

  const { data: districtData, isLoading: districtsLoading } = useGetDistrictsByStateQuery(1)
  const districts = districtData?.data ?? []

  const hasActiveFilters = !!(
    filters.keyword ||
    filters.deityName ||
    filters.districtId ||
    (filters.grade && filters.grade.length > 0)
  )

  const handleViewEdit = (temple: TempleSearchResultResponse) => {
    if (temple.id === myTempleId) {
      // Own temple — navigate to the full TA temple profile page
      navigate(ROUTE_PATHS.TA_TEMPLE)
    } else {
      // Other temple — navigate to limited read-only view, passing data for display
      navigate(
        ROUTE_PATHS.TA_TEMPLE_DETAIL.replace(':templeId', String(temple.id)),
        { state: { templeSearchResult: temple } },
      )
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Temples</h1>
          <p className="text-sm text-slate-500 mt-0.5">Browse all registered temples. Click "View &amp; Edit" on your temple to manage its details.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Temple name…"
              value={localKeyword}
              onChange={(e) => setLocalKeyword(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="relative flex-1">
            <Input
              placeholder="Deity name…"
              value={localDeityName}
              onChange={(e) => setLocalDeityName(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="w-full sm:w-52">
            <SearchableSelect
              value={filters.districtId?.toString() ?? ''}
              options={districts.map((d) => ({ value: d.id.toString(), label: d.name }))}
              placeholder="District…"
              searchPlaceholder="Search district…"
              isLoading={districtsLoading}
              onSelect={(v) => applyFilters({ districtId: Number(v) })}
              onClear={() => applyFilters({ districtId: undefined })}
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0 h-9 w-9" aria-label="Clear">
              <RotateCcw size={15} />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-slate-500">Grade:</span>
          {GRADES.map((g) => {
            const selected = filters.grade?.includes(g)
            return (
              <button
                key={g}
                type="button"
                onClick={() => {
                  const curr = filters.grade ?? []
                  applyFilters({ grade: selected ? curr.filter((x) => x !== g) : [...curr, g] })
                }}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
                  selected ? GRADE_SELECTED_COLORS[g] : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400',
                )}
              >
                Grade {g}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {isFetching ? (
            <span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Searching…</span>
          ) : (
            <>
              <span className="font-semibold text-slate-900">{total.toLocaleString()}</span> temple{total !== 1 ? 's' : ''} found
            </>
          )}
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && isError && (
        <EmptyState title="Failed to load" description="Could not load temple list. Please try again." />
      )}

      {/* Empty */}
      {!isLoading && !isError && temples.length === 0 && (
        <EmptyState
          title="No temples found"
          description={hasActiveFilters ? 'Try adjusting your filters.' : 'No temples registered yet.'}
          action={hasActiveFilters ? { label: 'Clear filters', onClick: clearFilters } : undefined}
        />
      )}

      {/* Grid */}
      {!isLoading && !isError && temples.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {temples.map((temple) => (
              <TempleCard
                key={temple.id}
                temple={temple}
                isOwn={temple.id === myTempleId}
                onViewEdit={handleViewEdit}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page === 0 || isFetching}>Previous</Button>
              <span className="text-sm text-slate-600">Page {page + 1} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= totalPages - 1 || isFetching}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
