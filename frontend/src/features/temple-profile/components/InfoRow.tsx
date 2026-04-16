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

  return (
    <div className={cn('grid grid-cols-[160px_1fr] gap-2 text-sm', className)}>
      <span className="text-muted-foreground font-medium shrink-0">{label}</span>
      {multiline ? (
        <p className="text-foreground whitespace-pre-wrap leading-relaxed">{display}</p>
      ) : (
        <span className="text-foreground">{display}</span>
      )}
    </div>
  )
}
