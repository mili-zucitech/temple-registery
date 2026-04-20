import { cn } from '@/lib/utils'
import type { TempleGrade } from '@/features/temple-profile/hooks/templeTypes'

const GRADE_CLASSES: Record<TempleGrade, string> = {
  A: 'bg-temple-gold/10 text-temple-gold border-temple-gold/30',
  B: 'bg-info/10 text-info border-info/20',
  C: 'bg-muted text-foreground border-border',
}

export function TempleGradeBadge({ grade, className }: { grade: TempleGrade; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
        GRADE_CLASSES[grade],
        className,
      )}
    >
      Grade {grade}
    </span>
  )
}
