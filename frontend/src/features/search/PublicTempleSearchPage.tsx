import { memo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, RotateCcw, Building2, MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { usePublicTempleSearch } from './usePublicTempleSearch'
import { useGetDistrictsByStateQuery } from '@/features/geo/geoApi'
import { useAppSelector } from '@/app/store'
import { USER_ROLES } from '@/constants/roles'
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

const TempleCard = memo(function TempleCard({ temple }: { temple: TempleSearchResultResponse }) {
  const gradeColor = GRADE_COLORS[temple.grade] ?? 'bg-slate-100 text-slate-700'

  return (
    <div className="group bg-white rounded-xl border border-slate-200 hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      {/* Photo */}
      <div className="h-36 bg-gradient-to-br from-amber-50 to-orange-100 relative overflow-hidden flex-shrink-0">
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
            <Building2 size={40} className="text-amber-300" />
          </div>
        )}
        {/* Grade badge */}
        <span className={cn('absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold', gradeColor)}>
          Grade {temple.grade}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm leading-tight">{temple.name}</h3>

        {temple.primaryDeity && (
          <p className="text-xs text-slate-500">
            <span className="font-medium text-slate-600">Deity:</span> {temple.primaryDeity}
          </p>
        )}
        {temple.districtName && (
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <MapPin size={11} className="text-slate-400 flex-shrink-0" />
            {temple.districtName}
          </p>
        )}

        {temple.trustRegistered && (
          <span className="mt-auto self-start text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Trust Registered
          </span>
        )}
      </div>
    </div>
  )
})

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PublicTempleSearchPage() {
  const navigate = useNavigate()
  const currentUser = useAppSelector((s) => s.auth.currentUser)

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

  // Geo — load all Karnataka districts (stateId=1)
  const { data: districtData, isLoading: districtsLoading } = useGetDistrictsByStateQuery(1)
  const districts = districtData?.data ?? []

  // Auth-aware banner helpers
  const dashboardPath = (() => {
    if (!currentUser) return null
    if (currentUser.role === USER_ROLES.DISTRICT_COLLECTOR || currentUser.role === USER_ROLES.DC_STAFF) return ROUTE_PATHS.DC_DASHBOARD
    if (currentUser.role === USER_ROLES.TEMPLE_AUTHORITY) return ROUTE_PATHS.TA_DASHBOARD
    if (currentUser.role === USER_ROLES.SUPER_ADMIN) return ROUTE_PATHS.ADMIN_DASHBOARD
    if (currentUser.role === USER_ROLES.AUDITOR) return ROUTE_PATHS.AUDITOR_DASHBOARD
    return null
  })()

  const hasActiveFilters = !!(
    filters.keyword ||
    filters.deityName ||
    filters.districtId ||
    (filters.grade && filters.grade.length > 0)
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* ── Minimal public header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-amber-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={22} className="text-amber-600" />
            <span className="font-bold text-slate-900 text-base">Temple Registry</span>
            <span className="hidden sm:inline ml-2 text-xs text-slate-400">| Public Search</span>
          </div>
          <div className="flex items-center gap-2">
            {currentUser ? (
              dashboardPath ? (
                <Button size="sm" variant="default" onClick={() => navigate(dashboardPath)}>
                  Go to Dashboard
                </Button>
              ) : null
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link to={ROUTE_PATHS.LOGIN}>Login</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Auth-aware banner ─────────────────────────────────────────────── */}
      {currentUser && dashboardPath && (
        <div className="bg-blue-50 border-b border-blue-200 py-2 px-4 text-center text-xs text-blue-700">
          You are logged in as <strong>{currentUser.role}</strong>.{' '}
          <button
            type="button"
            className="underline font-medium hover:text-blue-900"
            onClick={() => navigate(dashboardPath)}
          >
            Go to your dashboard →
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Find a Temple
          </h1>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Search the Karnataka Temple Registry. Browse by name, deity, district, or grade.
          </p>
        </div>

        {/* ── Search Bar ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Keyword */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="public-search-keyword"
                placeholder="Temple name…"
                value={localKeyword}
                onChange={(e) => setLocalKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Deity */}
            <div className="relative flex-1">
              <Input
                placeholder="Deity name…"
                value={localDeityName}
                onChange={(e) => setLocalDeityName(e.target.value)}
              />
            </div>
            {/* District */}
            <div className="w-full sm:w-56">
              <SearchableSelect
                value={filters.districtId?.toString() ?? ''}
                options={districts.map((d) => ({ value: d.id.toString(), label: d.name }))}
                placeholder="Select district…"
                searchPlaceholder="Search district…"
                isLoading={districtsLoading}
                onSelect={(v) => applyFilters({ districtId: Number(v) })}
                onClear={() => applyFilters({ districtId: undefined })}
              />
            </div>
            {/* Clear */}
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0" aria-label="Clear filters">
                <RotateCcw size={16} />
              </Button>
            )}
          </div>

          {/* Grade pills */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">Grade:</span>
            {GRADES.map((g) => {
              const isSelected = filters.grade?.includes(g)
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    const current = filters.grade ?? []
                    applyFilters({
                      grade: isSelected ? current.filter((x) => x !== g) : [...current, g],
                    })
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
                    isSelected ? GRADE_SELECTED_COLORS[g] : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400',
                  )}
                >
                  Grade {g}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Results ──────────────────────────────────────────────────────── */}
        <div>
          {/* Result count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              {isFetching ? (
                <span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Searching…</span>
              ) : isError ? (
                <span className="text-destructive">Failed to load results</span>
              ) : (
                <>
                  <span className="font-semibold text-slate-900">{total.toLocaleString()}</span>{' '}
                  temple{total !== 1 ? 's' : ''} found
                </>
              )}
            </p>
            {hasActiveFilters && !isLoading && (
              <button type="button" onClick={clearFilters} className="text-xs text-muted-foreground hover:text-destructive underline transition-colors">
                Clear all filters
              </button>
            )}
          </div>

          {/* Loading skeletons */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <Skeleton className="h-36 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!isLoading && isError && (
            <EmptyState
              title="Failed to load temples"
              description="An error occurred while fetching temple data. Please try again."
            />
          )}

          {/* Empty state */}
          {!isLoading && !isError && temples.length === 0 && (
            <EmptyState
              title="No temples found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your filters to find more results.'
                  : 'No temples have been registered yet.'
              }
              action={
                hasActiveFilters
                  ? { label: 'Clear filters', onClick: clearFilters }
                  : undefined
              }
            />
          )}

          {/* Temple grid */}
          {!isLoading && !isError && temples.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {temples.map((temple) => (
                  <TempleCard key={temple.id} temple={temple} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 0 || isFetching}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages - 1 || isFetching}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        Karnataka Temple Registry — Public Information Portal
      </footer>
    </div>
  )
}
