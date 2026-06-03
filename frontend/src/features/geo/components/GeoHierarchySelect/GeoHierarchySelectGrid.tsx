import { useEffect } from 'react'
import { Lock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGeoHierarchy } from '../../geoHooks'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import type { GeoSelection } from '../../geoTypes'

interface GeoHierarchySelectGridProps {
  value: GeoSelection
  onChange: (selection: GeoSelection) => void
  disabled?: boolean
  /** Levels that should be displayed as read-only locked fields. State is always locked. */
  lockedLevels?: ('city' | 'district' | 'taluk' | 'hobli')[]
  /** When provided, a "Detect my current location" button is shown. The callback should set lat/lng on the parent form. */
  onDetectLocation?: () => void
  detectingLocation?: boolean
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

export function GeoHierarchySelectGrid({ value, onChange, disabled, lockedLevels = [], onDetectLocation, detectingLocation }: GeoHierarchySelectGridProps) {
  const { states, cities, districts, taluks, hoblis } = useGeoHierarchy(value)

  const isCityLocked     = lockedLevels.includes('city')
  const isDistrictLocked = lockedLevels.includes('district')
  const isTalukLocked    = lockedLevels.includes('taluk')
  const isHobliLocked    = lockedLevels.includes('hobli')

  // Auto-select the first state (Karnataka) whenever stateId is missing and state data is available.
  // This also handles the case where temple prefill sets districtId/talukId/hobliId without a stateId,
  // which would cause cities/districts queries to be skipped.
  useEffect(() => {
    if (!value.stateId && states.data.length > 0) {
      onChange({ ...value, stateId: states.data[0].id })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states.data.length, value.stateId])

  // Auto-resolve cityId from district data when districtId is known but cityId is missing.
  useEffect(() => {
    if (value.districtId && !value.cityId && districts.data.length > 0) {
      const district = districts.data.find((d) => d.id === value.districtId)
      if (district?.cityId) {
        onChange({ ...value, cityId: district.cityId })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.districtId, value.cityId, districts.data.length])

  // Auto-resolve talukId from hobli data when hobliId is known but talukId is missing.
  useEffect(() => {
    if (value.hobliId && !value.talukId && hoblis.data.length > 0) {
      const hobli = hoblis.data.find((h) => h.id === value.hobliId)
      if (hobli?.talukId) {
        onChange({ ...value, talukId: hobli.talukId })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.hobliId, value.talukId, hoblis.data.length])

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
        <GeoLevel label="City / Division" isLocked={isCityLocked} lockedValue={cities.data.find(c => c.id === value.cityId)?.name ?? (value.cityId ? '…' : '—')}>
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
        <GeoLevel label="District" isLocked={isDistrictLocked} lockedValue={districts.data.find(d => d.id === value.districtId)?.name ?? (value.districtId ? '…' : '—')}>
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
        <GeoLevel label="Taluk" isLocked={isTalukLocked} lockedValue={taluks.data.find(t => t.id === value.talukId)?.name ?? (value.talukId ? '…' : '—')}>
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
        <GeoLevel label="Hobli" isLocked={isHobliLocked} lockedValue={hoblis.data.find(h => h.id === value.hobliId)?.name ?? (value.hobliId ? '…' : '—')}>
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

      {/* ── Footer row ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-0.5">
        <p className="text-[11px] text-muted-foreground/70">
          {hasLocationSelection(value)
            ? 'Partial selections are allowed — results narrow as you go deeper.'
            : '\u00a0'}
        </p>
        {onDetectLocation && (
          <button
            type="button"
            onClick={onDetectLocation}
            disabled={detectingLocation || disabled}
            className={cn(
              'flex items-center gap-1.5 text-[11px] font-medium text-primary',
              'rounded px-2 py-1 transition-colors',
              'hover:bg-primary/10',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            aria-label="Detect my current location using GPS"
          >
            <MapPin size={11} aria-hidden />
            {detectingLocation ? 'Detecting…' : 'Detect my current location'}
          </button>
        )}
      </div>
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
