import { cn } from '@/lib/utils'

interface InfoRowProps {
  label: string
  value?: string | number | null
  className?: string
  /** Render a full paragraph block instead of inline */
  multiline?: boolean
}

export function InfoRow({ label, value, className, multiline = false }: InfoRowProps) {
  const display = value != null && value !== '' ? String(value) : '—'
  const isEmpty = display === '—'

  return (
    <div className={cn('grid grid-cols-[180px_1fr] gap-3 text-sm', className)}>
      <span className="text-muted-foreground font-semibold shrink-0 tracking-wide">{label}</span>
      {multiline ? (
        <p className={cn(
          'whitespace-pre-wrap leading-relaxed',
          isEmpty ? 'text-muted-foreground/60 italic' : 'text-foreground font-medium'
        )}>
          {display}
        </p>
      ) : (
        <span className={cn(
          isEmpty ? 'text-muted-foreground/60 italic' : 'text-foreground font-medium'
        )}>
          {display}
        </span>
      )}
    </div>
  )
}
