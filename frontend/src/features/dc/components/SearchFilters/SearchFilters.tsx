import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DcTempleSearchFilterRequest } from '@/features/dc/dcTypes'

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

interface SearchFiltersProps {
  filters: DcTempleSearchFilterRequest
  hasActiveFilters: boolean
  onFilterChange: (patch: Partial<DcTempleSearchFilterRequest>) => void
  onClear: () => void
}

/**
 * DC temple search filter panel.
 *
 * Pure presentational component — receives current filter values as props
 * and emits partial patches via onFilterChange. State and URL sync are
 * managed by the parent hook (useDcTempleSearch).
 */
export function SearchFilters({
  filters,
  hasActiveFilters,
  onFilterChange,
  onClear,
}: SearchFiltersProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      {/* Keyword search */}
      <div className="flex gap-3 items-center">
        <Input
          className="flex-1"
          placeholder="Search by name, deity, registration number…"
          defaultValue={filters.keyword ?? ''}
          onChange={(e) => onFilterChange({ keyword: e.target.value || undefined })}
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="gap-1 text-muted-foreground flex-shrink-0"
          >
            <X size={14} />
            Clear
          </Button>
        )}
      </div>

      {/* Dropdown filters */}
      <div className="flex flex-wrap gap-3">
        {/* Grade */}
        <Select
          value={filters.grade?.[0] ?? ''}
          onValueChange={(v) => onFilterChange({ grade: v ? [v] : undefined })}
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

        {/* Tradition */}
        <Select
          value={filters.tradition ?? ''}
          onValueChange={(v) => onFilterChange({ tradition: v || undefined })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tradition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All traditions</SelectItem>
            {TRADITIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Declaration status */}
        <Select
          value={filters.declarationStatus ?? ''}
          onValueChange={(v) => onFilterChange({ declarationStatus: v || undefined })}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Declaration status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {DECLARATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Trust registered */}
        <Select
          value={
            filters.trustRegistered === true
              ? 'true'
              : filters.trustRegistered === false
                ? 'false'
                : ''
          }
          onValueChange={(v) =>
            onFilterChange({
              trustRegistered:
                v === 'true' ? true : v === 'false' ? false : undefined,
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
  )
}
