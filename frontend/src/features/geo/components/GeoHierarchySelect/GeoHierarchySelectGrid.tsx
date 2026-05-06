import { useEffect } from 'react'
import { Lock, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGeoHierarchy } from '../../geoHooks'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import type { GeoSelection } from '../../geoTypes'

interface GeoHierarchySelectGridProps {
  value: GeoSelection
  onChange: (selection: GeoSelection) => void
  disabled?: boolean
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true if at least one narrowing level (City/District/Taluk/Hobli)
 * has been selected — i.e. there is something to reset beyond State.
 */
function hasLocationSelection(value: GeoSelection): boolean {
  return !!(value.cityId || value.districtId || value.talukId || value.hobliId)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GeoHierarchySelectGrid({ value, onChange, disabled }: GeoHierarchySelectGridProps) {
  const { states, cities, districts, taluks, hoblis } = useGeoHierarchy(value)

  // Auto-select the first state (Karnataka) once geo data loads and the selection is completely empty.
  // Guard: do NOT fire if any geo level is already selected (prevents resetting on back-navigation).
  const hasAnySelection = !!(value.stateId || value.cityId || value.districtId || value.talukId || value.hobliId)
  useEffect(() => {
    if (!hasAnySelection && states.data.length > 0) {
      onChange({ stateId: states.data[0].id })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states.data.length, hasAnySelection])

  const handleSelect = (level: keyof GeoSelection, id: string) => {
    const numericId = Number(id)
    const updated: GeoSelection = { ...value }
    switch (level) {
      case 'stateId':
        updated.stateId = numericId
        delete updated.cityId; delete updated.districtId; delete updated.talukId; delete updated.hobliId
        break
      case 'cityId':
        updated.cityId = numericId
        delete updated.districtId; delete updated.talukId; delete updated.hobliId
        break
      case 'districtId':
        updated.districtId = numericId
        delete updated.talukId; delete updated.hobliId
        break
      case 'talukId':
        updated.talukId = numericId
        delete updated.hobliId
        break
      case 'hobliId':
        updated.hobliId = numericId
        break
    }
    onChange(updated)
  }

  const handleClear = (level: keyof GeoSelection) => {
    const updated: GeoSelection = { ...value }
    switch (level) {
      case 'cityId':
        delete updated.cityId; delete updated.districtId; delete updated.talukId; delete updated.hobliId
        break
      case 'districtId':
        delete updated.districtId; delete updated.talukId; delete updated.hobliId
        break
      case 'talukId':
        delete updated.talukId; delete updated.hobliId
        break
      case 'hobliId':
        delete updated.hobliId
        break
    }
    onChange(updated)
  }

  /** Clears everything below State level. */
  const resetLocation = () => {
    onChange({ stateId: value.stateId })
  }

  const stateName = states.data.find((s) => s.id === value.stateId)?.name

  return (
    <div className="space-y-4">
      {/* Row 1: State and City */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State — locked to Karnataka */}
        <GeoLevel
          label="State"
          isLocked
          lockedValue={stateName ?? 'Karnataka'}
        />

        {/* City / Division */}
        <GeoLevel label="City / Division">
          <SearchableSelect
            disabled={disabled}
            isLoading={cities.isLoading}
            value={value.cityId?.toString() ?? ''}
            options={cities.data.map((c) => ({ value: c.id.toString(), label: c.name }))}
            placeholder="Select city…"
            searchPlaceholder="Search city…"
            emptyText={cities.data.length === 0 && !cities.isLoading ? 'No cities available' : undefined}
            onSelect={(v) => handleSelect('cityId', v)}
            onClear={() => handleClear('cityId')}
          />
        </GeoLevel>
      </div>

      {/* Row 2: District and Taluk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* District */}
        <GeoLevel label="District">
          <SearchableSelect
            disabled={disabled}
            isLoading={districts.isLoading}
            value={value.districtId?.toString() ?? ''}
            options={districts.data.map((d) => ({ value: d.id.toString(), label: d.name }))}
            placeholder="Select district…"
            searchPlaceholder="Search district…"
            emptyText={districts.data.length === 0 && !districts.isLoading ? 'No districts found' : undefined}
            onSelect={(v) => handleSelect('districtId', v)}
            onClear={() => handleClear('districtId')}
          />
        </GeoLevel>

        {/* Taluk */}
        <GeoLevel label="Taluk">
          <SearchableSelect
            disabled={disabled}
            isLoading={taluks.isLoading}
            value={value.talukId?.toString() ?? ''}
            options={taluks.data.map((t) => ({ value: t.id.toString(), label: t.name }))}
            placeholder="Select taluk…"
            searchPlaceholder="Search taluk…"
            emptyText={taluks.data.length === 0 && !taluks.isLoading ? 'No taluks found' : undefined}
            onSelect={(v) => handleSelect('talukId', v)}
            onClear={() => handleClear('talukId')}
          />
        </GeoLevel>
      </div>

      {/* Row 3: Hobli (full width) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GeoLevel label="Hobli">
          <SearchableSelect
            disabled={disabled}
            isLoading={hoblis.isLoading}
            value={value.hobliId?.toString() ?? ''}
            options={hoblis.data.map((h) => ({ value: h.id.toString(), label: h.name }))}
            placeholder="Select hobli…"
            searchPlaceholder="Search hobli…"
            emptyText={hoblis.data.length === 0 && !hoblis.isLoading ? 'No hoblies found' : undefined}
            onSelect={(v) => handleSelect('hobliId', v)}
            onClear={() => handleClear('hobliId')}
          />
        </GeoLevel>
      </div>

      {/* ── Reset location ─────────────────────────────────────────────── */}
      {hasLocationSelection(value) && (
        <div className="flex items-center justify-between pt-0.5">
          <p className="text-[11px] text-muted-foreground/70">
            Partial selections are allowed — results narrow as you go deeper.
          </p>
          <button
            type="button"
            onClick={resetLocation}
            className={cn(
              'flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground',
              'rounded px-2 py-1 transition-colors',
              'hover:text-foreground hover:bg-muted/60',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
            aria-label="Reset location filters — clear city, district, taluk and hobli"
          >
            <RotateCcw size={11} aria-hidden />
            Reset location
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface GeoLevelProps {
  label: string
  children?: React.ReactNode
  helperText?: string
  isLocked?: boolean
  lockedValue?: string
}

function GeoLevel({ label, children, helperText, isLocked, lockedValue }: GeoLevelProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {isLocked && (
          <Lock size={10} className="text-muted-foreground/50 shrink-0" aria-label="Locked" />
        )}
      </div>

      {isLocked ? (
        <div
          className={cn(
            'flex h-10 items-center rounded-md border border-border/60 bg-muted/50',
            'px-3 text-sm text-muted-foreground cursor-not-allowed select-none',
          )}
          aria-label={`State locked to ${lockedValue}`}
          aria-disabled="true"
        >
          <span className="truncate font-medium text-foreground/70">{lockedValue}</span>
        </div>
      ) : (
        children
      )}

      {helperText && (
        <p className="text-[10px] text-muted-foreground/60 leading-tight" aria-live="polite">
          {helperText}
        </p>
      )}
    </div>
  )
}
