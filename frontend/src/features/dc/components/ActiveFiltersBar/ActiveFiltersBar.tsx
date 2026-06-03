import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DcTempleSearchFilterRequest } from '@/features/dc/dcTypes'
import { getDeclarationFilterStatusLabel } from '@/features/dc/declarationStatusFilters'

const TRADITION_LABELS: Record<string, string> = {
  SHAIVITE:   'Shaivite',
  VAISHNAVITE:'Vaishnavite',
  SHAKTA:     'Shakta',
  JAIN:       'Jain',
  BUDDHIST:   'Buddhist',
  OTHER:      'Other',
}

interface ActiveChip {
  key: string
  label: string
  onRemove: () => void
}

interface ActiveFiltersBarProps {
  filters: DcTempleSearchFilterRequest
  /** Same stable ref as applyFilters from the hook — no new state needed. */
  onRemove: (patch: Partial<DcTempleSearchFilterRequest>) => void
  /** Full reset — same as clearFilters from the hook. */
  onClearAll: () => void
  /**
   * Geo removal requires clearing descendent levels too.
   * Called with the level to clear ('district' | 'taluk' | 'hobli').
   * The page passes applyGeoSelection with the appropriate pruned selection.
   */
  onRemoveGeo: (level: 'district' | 'taluk' | 'hobli') => void
  /** Resolved names for geo chips — passed from page which already calls useGeoHierarchy. */
  geoNames?: {
    cityName?: string
    districtName?: string
    talukName?: string
    hobliName?: string
  }
}

/**
 * Displays active filters as individually-removable chips above the results table.
 * Pure presentational — all state is derived from `filters` prop; nothing stored locally.
 * Renders null when no filters are active (not even a wrapper div).
 */
export function ActiveFiltersBar({ filters, onRemove, onClearAll, onRemoveGeo, geoNames }: ActiveFiltersBarProps) {
  const chips: ActiveChip[] = []

  if (filters.keyword) {
    chips.push({
      key: 'keyword',
      label: `Name: "${filters.keyword}"`,
      onRemove: () => onRemove({ keyword: undefined }),
    })
  }

  if (filters.deityName) {
    chips.push({
      key: 'deityName',
      label: `Deity: "${filters.deityName}"`,
      onRemove: () => onRemove({ deityName: undefined }),
    })
  }

  filters.grade?.forEach((g) => {
    chips.push({
      key: `grade-${g}`,
      label: `Grade ${g}`,
      onRemove: () => {
        const next = (filters.grade ?? []).filter((x) => x !== g)
        onRemove({ grade: next.length > 0 ? next : undefined })
      },
    })
  })

  if (filters.tradition) {
    chips.push({
      key: 'tradition',
      label: `Tradition: ${TRADITION_LABELS[filters.tradition] ?? filters.tradition}`,
      onRemove: () => onRemove({ tradition: undefined }),
    })
  }

  if (filters.declarationStatus) {
    chips.push({
      key: 'declarationStatus',
      label: getDeclarationFilterStatusLabel(filters.declarationStatus),
      onRemove: () => onRemove({ declarationStatus: undefined }),
    })
  }

  if (filters.trustRegistered === true) {
    chips.push({
      key: 'trust',
      label: 'Trust: Registered',
      onRemove: () => onRemove({ trustRegistered: undefined }),
    })
  } else if (filters.trustRegistered === false) {
    chips.push({
      key: 'trust',
      label: 'Trust: Unregistered',
      onRemove: () => onRemove({ trustRegistered: undefined }),
    })
  }

  if (filters.establishedYearFrom !== undefined) {
    chips.push({
      key: 'yearFrom',
      label: `From: ${filters.establishedYearFrom}`,
      onRemove: () => onRemove({ establishedYearFrom: undefined }),
    })
  }

  if (filters.establishedYearTo !== undefined) {
    chips.push({
      key: 'yearTo',
      label: `To: ${filters.establishedYearTo}`,
      onRemove: () => onRemove({ establishedYearTo: undefined }),
    })
  }

  if (filters.hobliId !== undefined) {
    chips.push({
      key: 'hobli',
      label: geoNames?.hobliName ? `Hobli: ${geoNames.hobliName}` : 'Hobli selected',
      onRemove: () => onRemoveGeo('hobli'),
    })
  }

  if (filters.talukId !== undefined) {
    chips.push({
      key: 'taluk',
      label: geoNames?.talukName ? `Taluk: ${geoNames.talukName}` : 'Taluk selected',
      onRemove: () => onRemoveGeo('taluk'),
    })
  }

  if (filters.districtId !== undefined) {
    chips.push({
      key: 'district',
      label: geoNames?.districtName ? `District: ${geoNames.districtName}` : 'District selected',
      onRemove: () => onRemoveGeo('district'),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(({ key, label, onRemove: remove }) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 pl-3 pr-1.5 py-1 text-xs font-medium text-foreground"
        >
          {label}
          <button
            type="button"
            aria-label={`Remove filter: ${label}`}
            onClick={remove}
            className="ml-0.5 rounded-full p-0.5 opacity-60 hover:opacity-100 hover:bg-muted transition-opacity duration-150 outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <X size={10} />
          </button>
        </span>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Clear all
      </Button>
    </div>
  )
}
