import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { VisibilityItem as VisibilityItemType } from '../constants/uiVisibilityRegistry'

// ─── VisibilityItem ───────────────────────────────────────────────────────────

interface VisibilityItemProps {
  item: VisibilityItemType
  enabled: boolean
  isSaving: boolean
  onToggle: (key: string, targetType: string, enabled: boolean) => void
}

export function VisibilityItem({ item, enabled, isSaving, onToggle }: VisibilityItemProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-150',
        'border border-border/60 bg-card hover:bg-accent/30',
        !enabled && 'opacity-60',
      )}
    >
      <div className="min-w-0 flex-1 mr-4">
        <p className="text-sm font-medium text-foreground leading-tight">{item.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isSaving && (
          <div className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        )}
        {/* Custom toggle switch */}
        <button
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? 'Disable' : 'Enable'} ${item.label}`}
          disabled={isSaving}
          onClick={() => onToggle(item.key, item.targetType, !enabled)}
          className={cn(
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
            'transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            enabled ? 'bg-primary' : 'bg-input',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
              enabled ? 'translate-x-5' : 'translate-x-0',
            )}
          />
        </button>
      </div>
    </div>
  )
}

// ─── VisibilitySection ────────────────────────────────────────────────────────

interface VisibilitySectionProps {
  title: string
  items: VisibilityItemType[]
  enabledKeys: Set<string>
  savingKeys: Set<string>
  onToggle: (key: string, targetType: string, enabled: boolean) => void
  defaultOpen?: boolean
}

export function VisibilitySection({
  title,
  items,
  enabledKeys,
  savingKeys,
  onToggle,
  defaultOpen = true,
}: VisibilitySectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const enabledCount = items.filter((i) => enabledKeys.has(i.key)).length

  return (
    <div className="rounded-2xl border border-border bg-card/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {enabledCount} / {items.length} visible
          </span>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            'text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Items */}
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {items.map((item) => (
            <VisibilityItem
              key={item.key}
              item={item}
              enabled={enabledKeys.has(item.key)}
              isSaving={savingKeys.has(item.key)}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
