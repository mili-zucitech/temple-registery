import { memo, useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@/lib/apiError'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  LayoutGrid,
  List,
  SlidersHorizontal,
  RotateCcw,
  AlertTriangle,
  Clock,
  Building2,
  CheckCircle2,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { USER_ROLES } from '@/constants/roles'
import { useAppSelector } from '@/app/store'
import { ReadOnlyBanner } from '@/components/feedback/ReadOnlyBanner/ReadOnlyBanner'
import { usePermissions } from '@/features/access-control/hooks/usePermissions'
import { TARGET_KEYS } from '@/features/access-control/constants/targetKeys'
import { useDcTempleSearch, useDcDashboard } from '@/features/dc/dcHooks'
import { useExportTemplesMutation } from '@/features/dc/dcApi'
import { useGeoHierarchy } from '@/features/geo/geoHooks'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { FilterChip } from '@/features/dc/components/FilterChip/FilterChip'
import type { DcTempleSearchItemResponse } from '@/features/dc/dcTypes'
import {
  DC_TEMPLE_SEARCH_FILTERS,
  getDeclarationBadgeClass,
  getDeclarationBadgeLabel,
} from '@/features/dc/declarationStatusFilters'

// ─── Constants ───────────────────────────────────────────────────────────────

const GRADES = ['A', 'B', 'C'] as const

type DirectoryViewMode = 'list' | 'table'

const GRADE_SELECTED_COLORS: Record<string, string> = {
  A: 'bg-emerald-600 hover:bg-emerald-700 border-transparent text-white',
  B: 'bg-amber-500 hover:bg-amber-600 border-transparent text-white',
  C: 'bg-orange-500 hover:bg-orange-600 border-transparent text-white',
}

// Filters that live in the More Filters drawer (trust, deity, tradition, year range)

// ─── Local debounce hook ─────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function DcTempleSearchPage() {
  const navigate = useNavigate()
  const role = useAppSelector((s) => s.auth.currentUser?.role)
  const { can } = usePermissions()
  const [viewMode, setViewMode] = useState<DirectoryViewMode>(() => {
    const v = localStorage.getItem('dcTempleDirectoryView')
    return v === 'table' || v === 'list' ? v : 'list'
  })
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const {
    temples,
    total,
    totalPages,
    filters,
    geoSelection,
    page,
    isLoading,
    isError,
    isFetching,
    refetchSearch,
    applyFilters,
    applyGeoSelection,
    clearFilters,
    goToPage,
    setSearchParams,
  } = useDcTempleSearch()

  const [exportTemples, { isLoading: exporting }] = useExportTemplesMutation()
  const handleExport = async () => {
    try {
      const result = await exportTemples({
        body: {
          format: 'CSV',
          districtId: filters.districtId,
          grade: filters.grade?.join(','),
          tradition: filters.tradition,
          trustRegistered: filters.trustRegistered,
        },
      }).unwrap()
      if (result.data?.status === 'SYNC_COMPLETE' && result.data?.downloadUrl) {
        const a = document.createElement('a')
        a.href = result.data.downloadUrl
        a.download = 'temples-export.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else if (result.data?.status === 'ASYNC_ACCEPTED') {
        toast.success('Export is being prepared. You will be notified when it is ready to download.')
      }
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Export failed. Please try again.'))
    }
  }

  const { dashboard, isLoading: dashLoading } = useDcDashboard()

  // Role-based KPI visibility: TA uses its own key set; DC/others use DC keys.
  const kpiPermKeys: Record<string, string> = role === USER_ROLES.TEMPLE_AUTHORITY
    ? {
        total:    TARGET_KEYS.KPI_TA_SEARCH_TOTAL_TEMPLES,
        overdue:  TARGET_KEYS.KPI_TA_SEARCH_OVERDUE,
        pending:  TARGET_KEYS.KPI_TA_SEARCH_PENDING,
        profiles: TARGET_KEYS.KPI_TA_SEARCH_PROFILE_REVIEWS,
      }
    : {
        total:    TARGET_KEYS.KPI_DC_TOTAL_TEMPLES,
        overdue:  TARGET_KEYS.KPI_DC_OVERDUE_DECLARATIONS,
        pending:  TARGET_KEYS.KPI_DC_PENDING_DECLARATIONS,
        profiles: TARGET_KEYS.KPI_DC_PROFILE_REVIEWS,
      }
  const canShowTile = Object.fromEntries(
    Object.entries(kpiPermKeys).map(([k, v]) => [k, can(v)]),
  ) as Record<string, boolean>

  // Role-based filter section permission keys for the search sidebar.
  const filterPermKeys: Record<string, string> = role === USER_ROLES.TEMPLE_AUTHORITY
    ? {
        declarationStatus: TARGET_KEYS.SECTION_TA_SEARCH_DECLARATION_STATUS,
        trustRegistered:   TARGET_KEYS.SECTION_TA_SEARCH_TRUST_REGISTERED,
        savedFilters:      TARGET_KEYS.SECTION_TA_SEARCH_SAVED_FILTERS,
        cardStatus:        TARGET_KEYS.SECTION_TA_SEARCH_CARD_STATUS,
        cardTrust:         TARGET_KEYS.SECTION_TA_SEARCH_CARD_TRUST,
      }
    : {
        declarationStatus: TARGET_KEYS.SECTION_DC_SEARCH_DECLARATION_STATUS,
        trustRegistered:   TARGET_KEYS.SECTION_DC_SEARCH_TRUST_REGISTERED,
        savedFilters:      TARGET_KEYS.SECTION_DC_SEARCH_SAVED_FILTERS,
        cardStatus:        TARGET_KEYS.SECTION_DC_SEARCH_CARD_STATUS,
        cardTrust:         TARGET_KEYS.SECTION_DC_SEARCH_CARD_TRUST,
      }

  // Mobile filter drawer (shown only on < lg)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => { localStorage.setItem('dcTempleDirectoryView', viewMode) }, [viewMode])

  // Debounced keyword
  const [localKeyword, setLocalKeyword] = useState(filters.keyword ?? '')

  const debouncedKeyword = useDebounce(localKeyword, 300)

  useEffect(() => {
    if (debouncedKeyword !== (filters.keyword ?? '')) {
      applyFilters({ keyword: debouncedKeyword || undefined })
    }
  }, [debouncedKeyword]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setLocalKeyword(filters.keyword ?? '') }, [filters.keyword])

  // Debounced deity name — sidebar input
  const [localDeityName, setLocalDeityName] = useState(filters.deityName ?? '')
  const debouncedDeityName = useDebounce(localDeityName, 400)

  useEffect(() => {
    if (debouncedDeityName !== (filters.deityName ?? '')) {
      applyFilters({ deityName: debouncedDeityName || undefined })
    }
  }, [debouncedDeityName]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setLocalDeityName(filters.deityName ?? '') }, [filters.deityName])

  // Year range — applied on blur / Enter (validated before committing)
  const [localYearFrom, setLocalYearFrom] = useState(filters.establishedYearFrom?.toString() ?? '')
  const [localYearTo,   setLocalYearTo]   = useState(filters.establishedYearTo?.toString() ?? '')
  const [yearError, setYearError] = useState<string | null>(null)

  useEffect(() => { setLocalYearFrom(filters.establishedYearFrom?.toString() ?? '') }, [filters.establishedYearFrom])
  useEffect(() => { setLocalYearTo(filters.establishedYearTo?.toString() ?? '') }, [filters.establishedYearTo])

  function applyYearRange() {
    const from = localYearFrom ? parseInt(localYearFrom, 10) : undefined
    const to   = localYearTo   ? parseInt(localYearTo,   10) : undefined
    if (from !== undefined && to !== undefined && from > to) {
      setYearError('From must be ≤ To')
      return
    }
    setYearError(null)
    applyFilters({ establishedYearFrom: from, establishedYearTo: to })
  }

  // Keyboard shortcut: "/" focuses the search field
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault()
        document.getElementById('temple-search-keyword')?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Geo name resolution — RTK Query cache hit, no extra network requests
  const { cities, districts, taluks, hoblis } = useGeoHierarchy(geoSelection)
  const cityName     = cities.data.find(c => c.id === geoSelection.cityId)?.name
  const districtName = districts.data.find(d => d.id === geoSelection.districtId)?.name
  const talukName    = taluks.data.find(t => t.id === geoSelection.talukId)?.name
  const hobliName    = hoblis.data.find(h => h.id === geoSelection.hobliId)?.name

  const districtIdToName = useMemo(() => {
    const map: Record<number, string> = {}
    districts.data.forEach((d) => { map[d.id] = d.name })
    return map
  }, [districts.data])

  const talukIdToName = useMemo(() => {
    const map: Record<number, string> = {}
    taluks.data.forEach((t) => { map[t.id] = t.name })
    return map
  }, [taluks.data])

  const hobliIdToName = useMemo(() => {
    const map: Record<number, string> = {}
    hoblis.data.forEach((h) => { map[h.id] = h.name })
    return map
  }, [hoblis.data])

  // Server-side sort via URL params
  const currentSort = filters.sort ?? 'name,asc'
  const [currentSortField, currentSortDir] = currentSort.split(',')

  function cycleSort(field: string) {
    if (currentSortField !== field) {
      applyFilters({ sort: `${field},asc` })
    } else if (currentSortDir !== 'desc') {
      applyFilters({ sort: `${field},desc` })
    } else {
      applyFilters({ sort: 'name,asc' })
    }
  }

  // Active filter count — drives the mobile badge
  const activeFilterCount = [
    filters.keyword,
    filters.deityName,
    filters.grade?.length ? '1' : undefined,
    filters.trustRegistered !== undefined ? '1' : undefined,
    filters.declarationStatus,
    filters.establishedYearFrom !== undefined ? '1' : undefined,
    filters.establishedYearTo !== undefined ? '1' : undefined,
    filters.districtId !== undefined ? '1' : undefined,
    filters.talukId !== undefined ? '1' : undefined,
    filters.hobliId !== undefined ? '1' : undefined,
  ].filter(Boolean).length

  const hasActiveFilters = activeFilterCount > 0

  const gradeCount = useMemo(() => {
    const map: Record<string, number> = {}
    dashboard?.gradeDistribution?.forEach(({ grade, count }) => { map[grade] = count })
    return map
  }, [dashboard?.gradeDistribution])

  const geoScopeLabel = hobliName ?? talukName ?? districtName ?? cityName ?? 'Karnataka'

  function handleClearAll() {
    clearFilters()
    setLocalKeyword('')
    setLocalDeityName('')
    setLocalYearFrom('')
    setLocalYearTo('')
    setYearError(null)
  }

  // ── FILTER SIDEBAR CONTENT ────────────────────────────────────────────────
  const filterSidebarContent = (
    <div className="flex flex-col gap-5">

      {/* LOCATION */}
      <div role="group" aria-label="Location filter">
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <MapPin size={11} aria-hidden /> Location
          </span>
          {(geoSelection.talukId || geoSelection.hobliId || geoSelection.districtId) && (
            <button
              type="button"
              onClick={() => applyGeoSelection({ stateId: geoSelection.stateId })}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
              aria-label="Clear location filters"
            >
              <RotateCcw size={10} aria-hidden />
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {/* State — locked */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">State</label>
            <div
              className="flex h-9 w-full items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground cursor-not-allowed select-none"
              aria-disabled="true"
            >
              <span className="font-medium text-foreground/70 truncate">Karnataka</span>
            </div>
          </div>

          {/* District */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
              District
            </label>
            <SearchableSelect
              value={geoSelection.districtId?.toString() ?? ''}
              options={districts.data.map(d => ({ value: d.id.toString(), label: d.name }))}
              placeholder="Select district…"
              searchPlaceholder="Search district…"
              isLoading={districts.isLoading}
              popoverClassName="z-[1100]"
              onSelect={v => {
                const updated = { ...geoSelection, districtId: Number(v) }
                delete updated.talukId
                delete updated.hobliId
                applyGeoSelection(updated)
              }}
              onClear={() => {
                const updated = { ...geoSelection }
                delete updated.districtId
                delete updated.talukId
                delete updated.hobliId
                applyGeoSelection(updated)
              }}
            />
          </div>

          {/* Taluk */}
          <div>
            <label
              className={cn(
                'block text-[11px] font-medium mb-1.5 transition-colors',
                geoSelection.districtId ? 'text-muted-foreground' : 'text-muted-foreground/40',
              )}
            >
              Taluk
              {!geoSelection.districtId && (
                <span className="ml-1.5 text-[10px] font-normal">(select district first)</span>
              )}
            </label>
            <SearchableSelect
              disabled={!geoSelection.districtId}
              value={geoSelection.talukId?.toString() ?? ''}
              options={taluks.data.map(t => ({ value: t.id.toString(), label: t.name }))}
              placeholder={geoSelection.districtId ? 'Select taluk…' : '—'}
              searchPlaceholder="Search taluk…"
              isLoading={taluks.isLoading}
              emptyText={taluks.data.length === 0 && !taluks.isLoading && !!geoSelection.districtId ? 'No taluks found' : undefined}
              popoverClassName="z-[1100]"
              onSelect={v => {
                const updated = { ...geoSelection, talukId: Number(v) }
                delete updated.hobliId
                applyGeoSelection(updated)
              }}
              onClear={() => {
                const updated = { ...geoSelection }
                delete updated.talukId
                delete updated.hobliId
                applyGeoSelection(updated)
              }}
            />
          </div>

          {/* Hobli */}
          <div>
            <label
              className={cn(
                'block text-[11px] font-medium mb-1.5 transition-colors',
                geoSelection.talukId ? 'text-muted-foreground' : 'text-muted-foreground/40',
              )}
            >
              Hobli
              {!geoSelection.talukId && (
                <span className="ml-1.5 text-[10px] font-normal">(select taluk first)</span>
              )}
            </label>
            <SearchableSelect
              disabled={!geoSelection.talukId}
              value={geoSelection.hobliId?.toString() ?? ''}
              options={hoblis.data.map(h => ({ value: h.id.toString(), label: h.name }))}
              placeholder={geoSelection.talukId ? 'Select hobli…' : '—'}
              searchPlaceholder="Search hobli…"
              isLoading={hoblis.isLoading}
              emptyText={hoblis.data.length === 0 && !hoblis.isLoading && !!geoSelection.talukId ? 'No hoblies found' : undefined}
              popoverClassName="z-[1100]"
              onSelect={v => applyGeoSelection({ ...geoSelection, hobliId: Number(v) })}
              onClear={() => {
                const updated = { ...geoSelection }
                delete updated.hobliId
                applyGeoSelection(updated)
              }}
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-border" aria-hidden />

      {/* TEMPLE NAME */}
      <div>
        <label
          htmlFor="temple-search-keyword"
          className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2"
        >
          Temple Name
        </label>
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none"
            size={13}
            aria-hidden
          />
          <Input
            id="temple-search-keyword"
            className="pl-8 h-8 text-sm"
            placeholder="Search by name…"
            value={localKeyword}
            onChange={e => setLocalKeyword(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') { setLocalKeyword(''); applyFilters({ keyword: undefined }) }
            }}
            autoComplete="off"
          />
          {localKeyword && (
            <button
              type="button"
              onClick={() => { setLocalKeyword(''); applyFilters({ keyword: undefined }) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Clear search"
            >
              <X size={12} aria-hidden />
            </button>
          )}
        </div>
        {!localKeyword && (
          <p className="text-[10px] text-muted-foreground/50 mt-1.5 select-none">
            Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">/</kbd> to focus
          </p>
        )}
      </div>

      {/* DEITY NAME */}
      <div>
        <label
          htmlFor="deity-name-filter"
          className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2"
        >
          Deity Name
        </label>
        <div className="relative">
          <Input
            id="deity-name-filter"
            className="h-8 text-sm"
            placeholder="e.g. Shiva, Vishnu…"
            value={localDeityName}
            onChange={e => setLocalDeityName(e.target.value)}
            autoComplete="off"
          />
          {localDeityName && (
            <button
              type="button"
              onClick={() => { setLocalDeityName(''); applyFilters({ deityName: undefined }) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Clear deity name"
            >
              <X size={12} aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div className="h-px bg-border" aria-hidden />

      {/* GRADE */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Grade</p>
        <div className="flex gap-1.5 flex-wrap">
          {GRADES.map(g => {
            const isSelected = filters.grade?.includes(g) ?? false
            return (
              <FilterChip
                key={g}
                label={`Grade ${g}`}
                selected={isSelected}
                selectedClassName={GRADE_SELECTED_COLORS[g]}
                onToggle={() => {
                  const next = isSelected
                    ? (filters.grade ?? []).filter(x => x !== g)
                    : [...(filters.grade ?? []), g]
                  applyFilters({ grade: next.length > 0 ? next : undefined })
                }}
              />
            )
          })}
          {filters.grade?.length ? (
            <button
              type="button"
              onClick={() => applyFilters({ grade: undefined })}
              className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              All
            </button>
          ) : null}
        </div>
      </div>

      {/* DECLARATION STATUS */}
      {can(filterPermKeys.declarationStatus) && (
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Declaration Status
        </p>
        <div className="flex gap-1.5 flex-wrap">
          <FilterChip
            label="Overdue"
            selected={filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.OVERDUE}
            selectedClassName="bg-destructive hover:bg-destructive/90 border-transparent text-white"
            onToggle={() => applyFilters({
              declarationStatus:
                filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.OVERDUE
                  ? undefined
                  : DC_TEMPLE_SEARCH_FILTERS.OVERDUE,
            })}
          />
          <FilterChip
            label="Pending"
            selected={filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.PENDING}
            selectedClassName="bg-amber-500 hover:bg-amber-600 border-transparent text-white"
            onToggle={() => applyFilters({
              declarationStatus:
                filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.PENDING
                  ? undefined
                  : DC_TEMPLE_SEARCH_FILTERS.PENDING,
            })}
          />
          <FilterChip
            label="Clarification Req."
            selected={filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.CLARIFICATION_REQUIRED}
            selectedClassName="bg-violet-600 hover:bg-violet-700 border-transparent text-white"
            onToggle={() => applyFilters({
              declarationStatus:
                filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.CLARIFICATION_REQUIRED
                  ? undefined
                  : DC_TEMPLE_SEARCH_FILTERS.CLARIFICATION_REQUIRED,
            })}
          />
          <FilterChip
            label="Clarification Resp."
            selected={filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.CLARIFICATION_RESPONDED}
            selectedClassName="bg-info hover:bg-info/90 border-transparent text-white"
            onToggle={() => applyFilters({
              declarationStatus:
                filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.CLARIFICATION_RESPONDED
                  ? undefined
                  : DC_TEMPLE_SEARCH_FILTERS.CLARIFICATION_RESPONDED,
            })}
          />
          <FilterChip
            label="Under Review"
            selected={filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.UNDER_REVIEW}
            selectedClassName="bg-primary hover:bg-primary/90 border-transparent text-white"
            onToggle={() => applyFilters({
              declarationStatus:
                filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.UNDER_REVIEW
                  ? undefined
                  : DC_TEMPLE_SEARCH_FILTERS.UNDER_REVIEW,
            })}
          />
          <FilterChip
            label="Declared"
            selected={filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.APPROVED}
            selectedClassName="bg-emerald-600 hover:bg-emerald-700 border-transparent text-white"
            onToggle={() => applyFilters({
              declarationStatus:
                filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.APPROVED
                  ? undefined
                  : DC_TEMPLE_SEARCH_FILTERS.APPROVED,
            })}
          />
        </div>
      </div>
      )}

      {/* TRUST REGISTRATION — 3-state toggle group */}
      {can(filterPermKeys.trustRegistered) && (
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Trust Registration
        </p>
        <div
          className="flex rounded-md border border-border overflow-hidden text-xs font-medium"
          role="group"
          aria-label="Trust registration filter"
        >
          {(
            [
              { label: 'All',          value: undefined as boolean | undefined },
              { label: 'Registered',   value: true  as boolean | undefined },
              { label: 'Unregistered', value: false as boolean | undefined },
            ]
          ).map(opt => {
            const isActive = filters.trustRegistered === opt.value
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => applyFilters({ trustRegistered: opt.value })}
                className={cn(
                  'flex-1 py-1.5 px-1 text-center transition-colors text-[11px]',
                  'border-r border-border last:border-r-0',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-card text-muted-foreground hover:bg-muted',
                )}
                aria-pressed={isActive}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
      )}

      {/* YEAR RANGE */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Year Established
        </p>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            className="h-8 text-sm w-0 flex-1 min-w-0"
            placeholder="From"
            value={localYearFrom}
            min={0}
            max={2026}
            onChange={e => { setLocalYearFrom(e.target.value); setYearError(null) }}
            onBlur={applyYearRange}
            onKeyDown={e => { if (e.key === 'Enter') applyYearRange() }}
            aria-label="Year established from"
          />
          <span className="text-muted-foreground text-sm shrink-0 select-none">–</span>
          <Input
            type="number"
            className="h-8 text-sm w-0 flex-1 min-w-0"
            placeholder="To"
            value={localYearTo}
            min={0}
            max={2026}
            onChange={e => { setLocalYearTo(e.target.value); setYearError(null) }}
            onBlur={applyYearRange}
            onKeyDown={e => { if (e.key === 'Enter') applyYearRange() }}
            aria-label="Year established to"
          />
        </div>
        {yearError && (
          <p className="text-xs text-destructive mt-1" role="alert">{yearError}</p>
        )}
      </div>

      {/* CLEAR ALL */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClearAll}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors pt-1"
          aria-label="Clear all filters"
        >
          <RotateCcw size={13} aria-hidden />
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <>
      {(role === USER_ROLES.AUDITOR || role === USER_ROLES.VIEWER) && (
        <ReadOnlyBanner message="You are browsing temples in read-only mode. No actions can be performed from this view." />
      )}
      {/* Mobile filter drawer — slides in from the left, renders the same filterSidebarContent
          used by the desktop sidebar. This ensures identical filter logic across breakpoints. */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col overflow-hidden">
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border shrink-0">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal size={14} aria-hidden />
              Filters
              {activeFilterCount > 0 && (
                <span className="h-5 min-w-[20px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1.5 tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {filterSidebarContent}
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex gap-6 items-start">

        {/* ── LEFT SIDEBAR (lg+) ────────────────────────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col w-64 shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto"
          aria-label="Search filters"
        >
          <div className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-lg px-5 py-5 transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <SlidersHorizontal size={16} aria-hidden className="text-primary" />
                Filters
              </h2>
              {activeFilterCount > 0 && (
                <span className="h-5 min-w-[20px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1.5 tabular-nums shadow-sm">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {filterSidebarContent}
          </div>
        </aside>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3" role="main" aria-label="Temple Search">

          {/* Page header with gradient */}
          <div 
            className="relative overflow-hidden rounded-xl px-5 py-3.5"
            style={{
              background: 'linear-gradient(135deg, hsl(36 80% 50%), hsl(24 85% 55%))',
              boxShadow: '0 4px 20px hsl(36 80% 50% / 0.25)'
            }}
          >
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 pointer-events-none" />
            <div className="absolute right-20 -bottom-10 h-28 w-28 rounded-full bg-white/10 pointer-events-none" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm">
                  <Building2 size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-white leading-tight">Temples Directory</h1>
                  <p className="text-[11px] text-white/70 mt-0.5 truncate">
                    {districtName ? `${districtName} District` : 'Karnataka'} · HR&CE Compliance
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
              {/* Mobile filter trigger (< lg) */}
              <Button
                size="sm"
                className="gap-1.5 lg:hidden relative bg-white/25 border border-white/30 hover:bg-white/40 text-white"
                onClick={() => setDrawerOpen(true)}
                aria-label={activeFilterCount > 0 ? `Filters (${activeFilterCount} active)` : 'Open filters'}
              >
                <SlidersHorizontal size={14} aria-hidden />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white text-orange-600 text-[10px] font-bold flex items-center justify-center leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              {/* Export */}
              <Button
                size="sm"
                className="gap-1.5 bg-white/25 border border-white/30 hover:bg-white/40 text-white"
                onClick={handleExport}
                disabled={total === 0 || isFetching || exporting}
                aria-label="Export current search results as CSV"
              >
                <Download size={14} aria-hidden />
                <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export'}</span>
              </Button>
              </div>
            </div>
          </div>

          {/* Compliance strip */}
          <ComplianceStrip dashboard={dashboard} isLoading={dashLoading} gradeCount={gradeCount} canShowTile={canShowTile} />

          {/* Result count + sort controls */}
          <div className="flex items-center justify-between gap-3 min-h-[28px]">
            <span className="text-sm text-foreground/80 tabular-nums" aria-live="polite" aria-atomic>
              {isLoading ? (
                <Skeleton className="h-4 w-36 inline-block" />
              ) : isFetching ? (
                <span className="flex items-center gap-1.5 text-primary/70 text-xs">
                  <Loader2 size={11} className="animate-spin" aria-hidden /> Updating…
                </span>
              ) : total > 0 ? (
                <>
                  <strong className="text-foreground font-semibold">{total.toLocaleString()}</strong>
                  {' temple'}{total !== 1 ? 's' : ''}{' '}
                  <span className="text-muted-foreground text-xs">in {geoScopeLabel}</span>
                </>
              ) : hasActiveFilters ? (
                <span className="text-muted-foreground text-sm">No results match your filters</span>
              ) : (
                <span className="text-muted-foreground text-sm">Select a location or apply filters</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {/* View mode */}
              <div className="hidden sm:flex items-center gap-1" role="toolbar" aria-label="Directory view controls">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors border',
                    viewMode === 'list'
                      ? 'border-primary/40 bg-primary/5 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                  aria-pressed={viewMode === 'list'}
                  title="List view"
                >
                  <LayoutGrid size={12} aria-hidden />
                  <span className="hidden md:inline">List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors border',
                    viewMode === 'table'
                      ? 'border-primary/40 bg-primary/5 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                  aria-pressed={viewMode === 'table'}
                  title="Table view"
                >
                  <List size={12} aria-hidden />
                  <span className="hidden md:inline">Table</span>
                </button>
              </div>

              {/* Sort — server-side via URL param */}
              <div className="flex items-center gap-1" role="toolbar" aria-label="Sort results">
              <span className="text-[11px] text-muted-foreground font-medium mr-0.5 hidden sm:inline">Sort:</span>
              {(
                [
                  { field: 'name',            label: 'Name' },
                  { field: 'grade',           label: 'Grade' },
                  { field: 'yearEstablished', label: 'Year' },
                ] as const
              ).map(({ field, label }) => {
                const isActive = currentSortField === field
                const Icon = isActive ? (currentSortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => cycleSort(field)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors border',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      isActive
                        ? 'border-primary/40 bg-primary/5 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                    aria-pressed={isActive}
                    aria-label={`Sort by ${label}${isActive ? `, ${currentSortDir}ending` : ''}`}
                  >
                    <span className="hidden sm:inline">{label}</span>
                    <Icon size={11} aria-hidden />
                  </button>
                )
              })}
            </div>
            </div>
          </div>

          {/* Saved filters (presets) — each preset is mutually exclusive:
               clicking one clears the other preset's conflicting param so results
               are always unambiguous. Active state mirrors the current URL filters. */}
          {can(filterPermKeys.savedFilters) && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-[11px] text-muted-foreground font-medium mr-1.5">Saved filters:</span>
            <Button
              variant={filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.NO_DECLARATION ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => applyFilters({
                declarationStatus: DC_TEMPLE_SEARCH_FILTERS.NO_DECLARATION,
                hasApprovedDeclaration: undefined,
              })}
              title="Temples with no approved declaration"
            >
              No Declaration
            </Button>
            <Button
              variant={filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.VERIFICATION_REQUIRED ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => applyFilters({
                declarationStatus: DC_TEMPLE_SEARCH_FILTERS.VERIFICATION_REQUIRED,
                hasApprovedDeclaration: undefined,
              })}
              title="Declarations submitted and pending DC review"
            >
              Pending Verification
            </Button>
            <Button
              variant={filters.declarationStatus === DC_TEMPLE_SEARCH_FILTERS.OVERDUE ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => applyFilters({
                declarationStatus: DC_TEMPLE_SEARCH_FILTERS.OVERDUE,
                hasApprovedDeclaration: undefined,
              })}
              title="Overdue declarations"
            >
              High Risk (Overdue)
            </Button>
          </div>
          )}

          {/* Results */}
          <div>
            {isLoading ? (
              <TempleCardSkeleton count={6} />
            ) : isError ? (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-3 py-16 text-center px-4"
                style={{ minHeight: 320 }}
              >
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-destructive" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Could not load temples</p>
                  <p className="text-xs text-muted-foreground mt-1">Check your connection or try again.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchSearch()}>
                  Retry
                </Button>
              </div>
            ) : isFetching && temples.length === 0 ? (
              <TempleCardSkeleton count={6} />
            ) : temples.length === 0 ? (
              <div className="rounded-lg border border-border border-dashed bg-card flex flex-col items-center justify-center gap-4 py-24 text-center px-6">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Building2 size={28} className="text-muted-foreground/60" aria-hidden />
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <p className="text-base font-semibold text-foreground">
                    {hasActiveFilters ? 'No temples match these filters' : 'No temples to show'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                      ? 'Try removing a filter or expanding the geographic scope.'
                      : 'Select a district or search by temple name to get started.'}
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={handleClearAll}>
                    <RotateCcw size={13} className="mr-1.5" aria-hidden /> Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'table' ? (
                  <div className={cn('rounded-lg border border-border bg-card overflow-hidden', isFetching && 'opacity-50 pointer-events-none')}>
                    {/* Bulk toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border-b border-border bg-muted/20">
                      <div className="text-xs text-muted-foreground tabular-nums">
                        Selected: <strong className="text-foreground">{selectedIds.size}</strong>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          disabled={selectedIds.size === 0}
                          title="Exports are filter-based today; selected export is planned."
                          onClick={() => handleExport()}
                        >
                          Export CSV/PDF
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" disabled title="Coming soon">
                          Send Notice
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" disabled title="Coming soon">
                          Assign Auditor
                        </Button>
                        {selectedIds.size > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs"
                            onClick={() => setSelectedIds(new Set())}
                          >
                            Clear selection
                          </Button>
                        )}
                      </div>
                    </div>

                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 border-b border-border">
                        <tr>
                          <th className="px-3 py-2 w-10">
                            <input
                              type="checkbox"
                              aria-label="Select all"
                              checked={selectedIds.size > 0 && selectedIds.size === temples.length}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedIds(new Set(temples.map(t => t.templeId)))
                                else setSelectedIds(new Set())
                              }}
                            />
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Temple</th>
                          <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Grade</th>
                          <th className="px-3 py-2 text-left font-semibold text-muted-foreground hidden md:table-cell">Taluk</th>
                          {can(filterPermKeys.cardStatus) && <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Declaration</th>}
                          <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Risk</th>
                          <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {temples.map((t) => {
                          const risk =
                            t.overdueDeclarations > 0 ? 'OVERDUE'
                            : !t.hasApprovedDeclaration ? 'NO_DECLARATION'
                            : t.pendingDeclarations > 0 ? 'PENDING'
                            : 'OK'
                          const riskLabel =
                            risk === 'OVERDUE' ? 'Overdue'
                            : risk === 'NO_DECLARATION' ? 'No Declaration'
                            : risk === 'PENDING' ? 'Pending'
                            : 'OK'
                          const riskClass =
                            risk === 'OVERDUE' ? 'bg-destructive/10 text-destructive'
                            : risk === 'NO_DECLARATION' ? 'bg-orange-500/10 text-orange-600'
                            : risk === 'PENDING' ? 'bg-amber-500/10 text-amber-700'
                            : 'bg-emerald-500/10 text-emerald-700'
                          const detailPath = role === USER_ROLES.AUDITOR
                            ? ROUTE_PATHS.AUDITOR_TEMPLE_DETAIL
                            : role === USER_ROLES.VIEWER
                            ? ROUTE_PATHS.VIEWER_TEMPLE_DETAIL
                            : ROUTE_PATHS.DC_TEMPLE_DETAIL
                          return (
                            <tr key={t.templeId} className="text-sm">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  aria-label={`Select temple ${t.name}`}
                                  checked={selectedIds.has(t.templeId)}
                                  onChange={(e) => {
                                    const next = new Set(selectedIds)
                                    if (e.target.checked) next.add(t.templeId)
                                    else next.delete(t.templeId)
                                    setSelectedIds(next)
                                  }}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-semibold text-foreground">{t.name}</div>
                                <div className="text-[11px] text-muted-foreground">{t.registrationNumber ?? `#${t.templeId}`}</div>
                              </td>
                              <td className="px-3 py-2">
                                <span className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                  t.grade === 'A' ? 'bg-emerald-500/10 text-emerald-700'
                                    : t.grade === 'B' ? 'bg-amber-500/10 text-amber-700'
                                      : 'bg-blue-500/10 text-blue-700',
                                )}>
                                  {t.grade}
                                </span>
                              </td>
                              <td className="px-3 py-2 hidden md:table-cell text-muted-foreground">
                                {t.talukId ? (talukIdToName[t.talukId] ?? `Taluk #${t.talukId}`) : '—'}
                              </td>
                              {can(filterPermKeys.cardStatus) && (
                              <td className="px-3 py-2">
                                <span className="text-muted-foreground text-xs">{getDeclarationBadgeLabel(t.assetDeclarationStatus)}</span>
                              </td>
                              )}
                              <td className="px-3 py-2">
                                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', riskClass)}>
                                  {riskLabel}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  onClick={() => navigate(detailPath.replace(':templeId', String(t.templeId)))}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'transition-opacity duration-200',
                      isFetching && 'opacity-50 pointer-events-none',
                      'space-y-2',
                    )}
                    role="list"
                    aria-label="Temple search results"
                    aria-busy={isFetching}
                  >
                    {temples.map((temple) => (
                      <TempleCard
                        key={temple.templeId}
                        temple={temple}
                        districtIdToName={districtIdToName}
                        talukIdToName={talukIdToName}
                        hobliIdToName={hobliIdToName}
                        showDeclarationStatus={can(filterPermKeys.cardStatus)}
                        showTrustStatus={can(filterPermKeys.cardTrust)}
                        onView={() => {
                          const detailPath = role === USER_ROLES.AUDITOR
                            ? ROUTE_PATHS.AUDITOR_TEMPLE_DETAIL
                            : role === USER_ROLES.VIEWER
                            ? ROUTE_PATHS.VIEWER_TEMPLE_DETAIL
                            : ROUTE_PATHS.DC_TEMPLE_DETAIL
                          navigate(detailPath.replace(':templeId', String(temple.templeId)))
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground pb-4">
              <span className="text-xs tabular-nums">
                Page <strong className="text-foreground">{page + 1}</strong> of{' '}
                <strong className="text-foreground">{totalPages}</strong>
                <span className="hidden sm:inline"> · {total.toLocaleString()} total</span>
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || isFetching}
                  onClick={() => goToPage(page - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={15} aria-hidden />
                  <span className="hidden sm:inline ml-1">Prev</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1 || isFetching}
                  onClick={() => goToPage(page + 1)}
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight size={15} aria-hidden />
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
// ─── Compliance Strip ─────────────────────────────────────────────────────────

interface ComplianceStripProps {
  dashboard: {
    totalTemples: number
    pendingDeclarations: number
    overdueDeclarations: number
    pendingProfileReviews: number
    gradeDistribution: Array<{ grade: string; count: number }>
  } | null
  isLoading: boolean
  gradeCount: Record<string, number>
  /** Per-tile visibility map from the page-level permission check. Absent key = visible. */
  canShowTile?: Record<string, boolean>
}

function ComplianceStrip({ dashboard, isLoading, gradeCount, canShowTile }: ComplianceStripProps) {
  const allTiles = [
    {
      key: 'total',
      icon: <Building2 size={12} className="text-blue-600" aria-hidden />,
      label: 'Total Temples',
      value: dashboard?.totalTemples,
      valueClass: 'text-blue-600',
      bgClass: 'bg-blue-500/10 border-blue-500/30',
      iconBg: 'bg-blue-500/10',
      urgent: false,
    },
    {
      key: 'overdue',
      icon: <AlertTriangle size={12} className="text-red-600" aria-hidden />,
      label: 'Overdue',
      value: dashboard?.overdueDeclarations,
      valueClass: 'text-red-600',
      bgClass: 'bg-red-500/10 border-red-500/30',
      iconBg: 'bg-red-500/10',
      urgent: (dashboard?.overdueDeclarations ?? 0) > 0,
    },
    {
      key: 'pending',
      icon: <Clock size={12} className="text-amber-600" aria-hidden />,
      label: 'Pending Review',
      value: dashboard?.pendingDeclarations,
      valueClass: 'text-amber-600',
      bgClass: 'bg-amber-500/10 border-amber-500/30',
      iconBg: 'bg-amber-500/10',
      urgent: false,
    },
    {
      key: 'profiles',
      icon: <CheckCircle2 size={12} className="text-emerald-600" aria-hidden />,
      label: 'Profile Reviews',
      value: dashboard?.pendingProfileReviews,
      valueClass: 'text-emerald-600',
      bgClass: 'bg-emerald-500/10 border-emerald-500/30',
      iconBg: 'bg-emerald-500/10',
      urgent: false,
    },
  ]

  const tiles = canShowTile
    ? allTiles.filter((t) => canShowTile[t.key] !== false)
    : allTiles

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      role="region"
      aria-label="District compliance overview"
    >
      {tiles.map((tile) => (
        <div
          key={tile.key}
          className={cn(
            'relative overflow-hidden rounded-lg border backdrop-blur-sm px-2.5 py-2 flex flex-col gap-1 transition-all duration-300 hover:shadow-md',
            tile.bgClass,
          )}
        >
          <div className="flex items-center gap-1.5 z-10">
            <div className={cn('p-1 rounded-md', tile.iconBg)}>
              {tile.icon}
            </div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              {tile.label}
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-10 mt-0.5" />
          ) : (
            <span className={cn('text-lg font-bold tabular-nums leading-none', tile.valueClass)}>
              {tile.value?.toLocaleString() ?? '—'}
            </span>
          )}
          {tile.key === 'total' && !isLoading && Object.keys(gradeCount).length > 0 && (
            <div className="flex gap-1 flex-wrap mt-0.5">
              {(['A', 'B', 'C'] as const).map((g) =>
                gradeCount[g] !== undefined ? (
                  <span
                    key={g}
                    className={cn(
                      'text-[8px] font-bold px-1 py-0.5 rounded',
                      g === 'A' && 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30',
                      g === 'B' && 'bg-amber-500/20 text-amber-700 border border-amber-500/30',
                      g === 'C' && 'bg-orange-500/20 text-orange-700 border border-orange-500/30',
                    )}
                  >
                    {g}: {gradeCount[g].toLocaleString()}
                  </span>
                ) : null,
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Card Skeleton ────────────────────────────────────────────────────────────

function TempleCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card px-4 py-4 flex gap-4 items-start">
          <Skeleton className="h-11 w-11 rounded-md shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-4.5 w-56" />
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-3 w-32" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-20 rounded-sm" />
              <Skeleton className="h-5 w-16 rounded-sm" />
              <Skeleton className="h-5 w-24 rounded-sm" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-md shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ─── TempleCard ───────────────────────────────────────────────────────────────

interface TempleCardProps {
  temple: DcTempleSearchItemResponse
  districtIdToName: Record<number, string>
  talukIdToName: Record<number, string>
  hobliIdToName: Record<number, string>
  showDeclarationStatus?: boolean
  showTrustStatus?: boolean
  onView: () => void
}

const TempleCard = memo(function TempleCard({
  temple,
  districtIdToName,
  talukIdToName,
  hobliIdToName,
  showDeclarationStatus = true,
  showTrustStatus = true,
  onView,
}: TempleCardProps) {
  const isUrgent    = temple.overdueDeclarations > 0
  const needsReview = temple.pendingDeclarations > 0

  const locationParts = [
    temple.districtId ? districtIdToName[temple.districtId] : undefined,
    temple.talukId    ? talukIdToName[temple.talukId]       : undefined,
    temple.hobliId    ? hobliIdToName[temple.hobliId]       : undefined,
  ].filter(Boolean) as string[]

  const actionLabel = isUrgent ? 'Urgent' : needsReview ? 'Review' : 'View'
  const actionVariant: 'destructive' | 'default' | 'outline' = isUrgent ? 'destructive' : needsReview ? 'default' : 'outline'

  return (
    <div
      className={cn(
        'group relative rounded-xl border px-5 py-4',
        'bg-card/60 backdrop-blur-xl shadow-sm transition-all duration-300',
        'hover:shadow-xl hover:-translate-y-1',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        'cursor-pointer',
        isUrgent ? 'border-destructive/40 bg-gradient-to-r from-destructive/5 to-transparent' : 'border-white/10 hover:border-white/20',
      )}
      role="listitem"
      onClick={onView}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onView() } }}
      tabIndex={0}
      aria-label={`${temple.name}${isUrgent ? ' — overdue declarations' : needsReview ? ' — pending review' : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" aria-hidden />
      <div className="flex items-center gap-3.5">
        {/* Grade tile */}
        <TempleGradeBadge grade={temple.grade} />

        {/* Name + location — primary scan target */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-base leading-tight group-hover:text-primary transition-colors truncate">
            {temple.name}
          </p>
          {locationParts.length > 0 && (
            <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">
              {locationParts.join(' › ')}
              {temple.yearEstablished && (
                <span className="text-muted-foreground/50 before:content-['·'] before:mx-1.5">
                  Est. {temple.yearEstablished}
                </span>
              )}
              {temple.primaryDeity && (
                <span className="text-muted-foreground/50 before:content-['·'] before:mx-1.5">
                  {temple.primaryDeity}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Badge cluster — grouped for fast scanning */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {showDeclarationStatus && <DeclarationStatusBadge status={temple.assetDeclarationStatus} />}
          {temple.pendingDeclarations > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-2 py-0.5">
              <span className="tabular-nums">{temple.pendingDeclarations}</span>
              <span className="font-normal">Pending</span>
            </span>
          )}
          {temple.overdueDeclarations > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/8 border border-destructive/20 rounded-sm px-2 py-0.5">
              <span className="tabular-nums">{temple.overdueDeclarations}</span>
              <span className="font-normal">Overdue</span>
            </span>
          )}
          {showTrustStatus && <TrustBadge registered={temple.hasActiveTrust} />}
        </div>

        {/* Review button — isolated from card click */}
        <div
          className="shrink-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Button
            variant={actionVariant}
            size="sm"
            className="gap-1"
            onClick={onView}
            aria-label={`${actionLabel} ${temple.name}`}
          >
            {actionLabel}
            <ChevronRight size={14} aria-hidden />
          </Button>
        </div>
      </div>

      {/* Mobile badge row — shown only on xs */}
      <div className="flex sm:hidden items-center gap-1.5 flex-wrap mt-2.5 pl-[calc(44px+14px)]">
        {showDeclarationStatus && <DeclarationStatusBadge status={temple.assetDeclarationStatus} />}
        {temple.pendingDeclarations > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-2 py-0.5">
            <span className="tabular-nums">{temple.pendingDeclarations}</span> Pending
          </span>
        )}
        {temple.overdueDeclarations > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/8 border border-destructive/20 rounded-sm px-2 py-0.5">
            <span className="tabular-nums">{temple.overdueDeclarations}</span> Overdue
          </span>
        )}
      </div>
    </div>
  )
})

// ─── Badge sub-components ─────────────────────────────────────────────────────

/** Large square grade tile used as the visual anchor on the left of each card. */
function TempleGradeBadge({ grade }: { grade?: string | null }) {
  const styles: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-emerald-200',
    B: 'bg-amber-100  text-amber-800  border-amber-300  ring-amber-200',
    C: 'bg-orange-100 text-orange-800 border-orange-300 ring-orange-200',
  }
  const cls = styles[grade ?? ''] ?? 'bg-muted text-muted-foreground border-border ring-transparent'
  return (
    <div
      className={cn(
        'h-11 w-11 rounded-lg border-2 ring-4 flex flex-col items-center justify-center shrink-0',
        cls,
      )}
      aria-label={`Grade ${grade ?? 'unclassified'}`}
      role="img"
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest leading-none opacity-70">Grd</span>
      <span className="text-base font-black leading-none mt-0.5">{grade ?? '—'}</span>
    </div>
  )
}

/** Inline declaration status badge with colour-coded background. */
function DeclarationStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-[11px] italic text-muted-foreground/60">No declaration</span>
  const cls = getDeclarationBadgeClass(status)
  const label = getDeclarationBadgeLabel(status)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
        cls,
      )}
      aria-label={`Declaration status: ${label}`}
    >
      {label}
    </span>
  )
}

/** Trust registration badge. */
function TrustBadge({ registered }: { registered: boolean }) {
  if (registered) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-sm px-2 py-0.5">
        <CheckCircle2 size={10} aria-hidden /> Trust
      </span>
    )
  }
  return (
    <span className="inline-flex items-center text-[11px] font-medium text-muted-foreground/60 bg-muted border border-border/60 rounded-sm px-2 py-0.5">
      No Trust
    </span>
  )
}
















