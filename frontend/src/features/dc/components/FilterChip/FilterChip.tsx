import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterChipProps {
  label: string
  selected: boolean
  onToggle: () => void
  className?: string
  /** Override the selected-state background/text classes (e.g. for grade color semantics). */
  selectedClassName?: string
}

/**
 * Interactive toggle chip for filter selections.
 *
 * Uses a native <button> rather than Shadcn Button for precise control over
 * active:scale-95 press feedback and check-icon layout without variant overrides.
 *
 * Keyboard: Space / Enter toggles. role="checkbox" + aria-checked for a11y.
 * Motion: transitions respect prefers-reduced-motion via Tailwind's motion-reduce modifier.
 */
export function FilterChip({ label, selected, onToggle, className, selectedClassName }: FilterChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        // Base layout
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer select-none',
        // Transitions — disabled when user prefers reduced motion
        'transition-all duration-150 motion-reduce:transition-none',
        // Press feedback
        'active:scale-95 motion-reduce:active:scale-100',
        // Focus ring (keyboard accessible)
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        // Selected state
        selected
          ? cn('bg-primary text-primary-foreground shadow-sm hover:bg-primary/90', selectedClassName)
          : 'border border-border bg-background text-foreground hover:bg-muted/70 hover:border-muted-foreground/40',
        className,
      )}
    >
      {selected && <Check size={11} className="shrink-0 opacity-90" />}
      {label}
    </button>
  )
}
