/**
 * SearchableSelect — Popover + Command-based typeahead dropdown.
 *
 * Fully replaces the basic <Select> in geo-hierarchy contexts where search +
 * clear are required. Stays within the shadcn/ui + Radix ecosystem — no new
 * third-party dependencies.
 *
 * Props mirror a simple controlled <select>:
 *   value       – currently selected id (string) or '' for none
 *   options     – array of { value: string; label: string }
 *   placeholder – shown when nothing is selected
 *   disabled    – disables trigger + prevents opening
 *   isLoading   – shows skeleton text in trigger
 *   onSelect    – called with selected value string
 *   onClear     – called when ✕ is clicked; if omitted the clear button is hidden
 */

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

export interface SelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  value: string
  options: SelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  /** Override the "No results found" text shown in the empty state. */
  emptyText?: string
  disabled?: boolean
  isLoading?: boolean
  onSelect: (value: string) => void
  onClear?: () => void
  className?: string
  /** Custom classes for the PopoverContent (e.g. z-index overrides) */
  popoverClassName?: string
}

export function SearchableSelect({
  value,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results found.',
  disabled = false,
  isLoading = false,
  onSelect,
  onClear,
  className,
  popoverClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [width, setWidth] = useState<number>(200)

  // Match dropdown width to trigger width
  useEffect(() => {
    if (triggerRef.current) {
      setWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  const selectedLabel = options.find((o) => o.value === value)?.label

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
            {isLoading ? 'Loading…' : selectedLabel ?? placeholder}
          </span>

          <span className="ml-2 flex shrink-0 items-center gap-0.5">
            {/* Clear (✕) — only shown when a value is selected and onClear is provided */}
            {selectedLabel && onClear && (
              <span
                role="button"
                aria-label="Clear selection"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onClear()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    onClear()
                  }
                }}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <X size={12} />
              </span>
            )}
            <ChevronsUpDown size={14} className="opacity-50" />
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className={cn('p-0', popoverClassName)}
        style={{ width }}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}   // cmdk matches on this
                  onSelect={() => {
                    onSelect(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    size={14}
                    className={cn('mr-2 shrink-0', value === option.value ? 'opacity-100' : 'opacity-0')}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
