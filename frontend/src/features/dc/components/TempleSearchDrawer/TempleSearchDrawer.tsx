import { useState, useEffect } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DcTempleSearchFilterRequest } from '@/features/dc/dcTypes'

// ─── Constants ──────────────────────────────────────────────────────────────

const TRADITIONS = [
  { value: 'SHAIVITE',    label: 'Shaivite' },
  { value: 'VAISHNAVITE', label: 'Vaishnavite' },
  { value: 'SHAKTA',      label: 'Shakta' },
  { value: 'JAIN',        label: 'Jain' },
  { value: 'BUDDHIST',    label: 'Buddhist' },
  { value: 'OTHER',       label: 'Other' },
] as const

// ─── Props ──────────────────────────────────────────────────────────────────

interface TempleSearchDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: DcTempleSearchFilterRequest
  onApply: (patch: Partial<DcTempleSearchFilterRequest>) => void
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Right-side Sheet with secondary filters: deity name, tradition, year range.
 * Uses staged (local) state — changes are not committed until "Apply" is clicked.
 * "Clear" resets staged state and removes these filters from the URL params.
 */
export function TempleSearchDrawer({
  open,
  onOpenChange,
  filters,
  onApply,
}: TempleSearchDrawerProps) {
  // Staged state — local copy, pending confirmation via Apply
  const [stagedDeityName, setStagedDeityName] = useState(filters.deityName ?? '')
  const [stagedTradition, setStagedTradition] = useState(filters.tradition ?? 'all')
  const [stagedTrust, setStagedTrust] = useState<boolean | undefined>(filters.trustRegistered)
  const [stagedYearFrom, setStagedYearFrom] = useState<string>(
    filters.establishedYearFrom !== undefined ? String(filters.establishedYearFrom) : '',
  )
  const [stagedYearTo, setStagedYearTo] = useState<string>(
    filters.establishedYearTo !== undefined ? String(filters.establishedYearTo) : '',
  )

  // Re-sync staged state from URL params each time the drawer is opened
  useEffect(() => {
    if (open) {
      setStagedDeityName(filters.deityName ?? '')
      setStagedTradition(filters.tradition ?? 'all')
      setStagedTrust(filters.trustRegistered)
      setStagedYearFrom(filters.establishedYearFrom !== undefined ? String(filters.establishedYearFrom) : '')
      setStagedYearTo(filters.establishedYearTo !== undefined ? String(filters.establishedYearTo) : '')
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const yearRangeError =
    Boolean(stagedYearFrom) &&
    Boolean(stagedYearTo) &&
    Number(stagedYearFrom) > Number(stagedYearTo)

  const hasCommittedDrawerFilters = Boolean(
    filters.deityName || filters.tradition || filters.trustRegistered !== undefined ||
    filters.establishedYearFrom !== undefined || filters.establishedYearTo !== undefined,
  )

  const hasStagedValues = Boolean(
    stagedDeityName || (stagedTradition && stagedTradition !== 'all') ||
    stagedTrust !== undefined || stagedYearFrom || stagedYearTo,
  )

  function handleApply() {
    if (yearRangeError) return
    onApply({
      deityName: stagedDeityName || undefined,
      tradition: stagedTradition !== 'all' ? stagedTradition : undefined,
      trustRegistered: stagedTrust,
      establishedYearFrom: stagedYearFrom ? Number(stagedYearFrom) : undefined,
      establishedYearTo: stagedYearTo ? Number(stagedYearTo) : undefined,
    })
    onOpenChange(false)
  }

  function handleClear() {
    setStagedDeityName('')
    setStagedTradition('all')
    setStagedTrust(undefined)
    setStagedYearFrom('')
    setStagedYearTo('')
    // Also remove committed URL params for these fields
    onApply({
      deityName: undefined,
      tradition: undefined,
      trustRegistered: undefined,
      establishedYearFrom: undefined,
      establishedYearTo: undefined,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        {/* Header */}
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-primary shrink-0" />
            <SheetTitle>More Filters</SheetTitle>
          </div>
          <SheetDescription>
            Narrow results by deity, tradition, or year of establishment.
          </SheetDescription>
        </SheetHeader>

        {/* Filters */}
        <SheetBody>

          {/* Trust Registration */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Trust Registered Only</p>
              <p className="text-xs text-muted-foreground">Show temples with an active trust registration.</p>
            </div>
            <Switch
              id="drawer-trust-switch"
              checked={stagedTrust === true}
              onCheckedChange={(checked) => setStagedTrust(checked ? true : undefined)}
            />
          </div>

          {/* Deity Name */}
          <div className="space-y-2">
            <label
              htmlFor="drawer-deity-name"
              className="text-sm font-medium text-foreground"
            >
              Deity Name
            </label>
            <Input
              id="drawer-deity-name"
              placeholder="e.g. Shiva, Vishnu, Lakshmi"
              value={stagedDeityName}
              onChange={(e) => setStagedDeityName(e.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">Partial match — any word in the deity name.</p>
          </div>

          {/* Tradition */}
          <div className="space-y-2">
            <label
              htmlFor="drawer-tradition"
              className="text-sm font-medium text-foreground"
            >
              Tradition
            </label>
            <Select
              value={stagedTradition}
              onValueChange={(v) => setStagedTradition(v)}
            >
              <SelectTrigger id="drawer-tradition" className="w-full">
                <SelectValue placeholder="All traditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All traditions</SelectItem>
                {TRADITIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year of Establishment */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Year of Establishment</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <label htmlFor="drawer-year-from" className="text-xs text-muted-foreground">From</label>
                <Input
                  id="drawer-year-from"
                  type="number"
                  placeholder="e.g. 800"
                  min={0}
                  max={new Date().getFullYear()}
                  value={stagedYearFrom}
                  onChange={(e) => setStagedYearFrom(e.target.value)}
                  className={yearRangeError ? 'border-destructive' : ''}
                />
              </div>
              <span className="text-muted-foreground text-sm pt-5">—</span>
              <div className="flex-1 space-y-1">
                <label htmlFor="drawer-year-to" className="text-xs text-muted-foreground">To</label>
                <Input
                  id="drawer-year-to"
                  type="number"
                  placeholder="e.g. 2000"
                  min={0}
                  max={new Date().getFullYear()}
                  value={stagedYearTo}
                  onChange={(e) => setStagedYearTo(e.target.value)}
                  className={yearRangeError ? 'border-destructive' : ''}
                />
              </div>
            </div>
            {yearRangeError && (
              <p className="text-xs text-destructive">"To" year must be after "From" year.</p>
            )}
          </div>

        </SheetBody>

        {/* Footer */}
        <SheetFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!hasStagedValues && !hasCommittedDrawerFilters}
            className="text-muted-foreground"
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={yearRangeError}
          >
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
