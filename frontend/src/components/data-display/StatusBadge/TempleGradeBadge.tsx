import { cn } from '@/lib/utils'
import type { TempleGrade } from '@/features/temple-profile/hooks/templeTypes'

const GRADE_CLASSES: Record<TempleGrade, string> = {
  A: 'bg-temple-gold/10 text-temple-gold border-temple-gold/30',
  B: 'bg-info/10 text-info border-info/20',
  C: 'bg-muted text-foreground border-border',
}

const GRADE_CLASSES_ON_DARK: Record<TempleGrade, string> = {
  A: 'bg-amber-400/30 text-amber-100 border-amber-300/50',
  B: 'bg-sky-400/30 text-sky-100 border-sky-300/50',
  C: 'bg-white/20 text-white border-white/40',
}

export function TempleGradeBadge({
  grade,
  className,
  variant = 'default',
}: {
  grade?: TempleGrade | null
  className?: string
  variant?: 'default' | 'on-dark'
}) {
  if (!grade) return null
  const classes = variant === 'on-dark' ? GRADE_CLASSES_ON_DARK : GRADE_CLASSES
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
        classes[grade],
        className,
      )}
    >
      Grade {grade}
    </span>
  )
}
