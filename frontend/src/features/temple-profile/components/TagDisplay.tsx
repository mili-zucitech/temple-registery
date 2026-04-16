import { cn } from '@/lib/utils'

interface TagDisplayProps {
  /** Comma-separated string or array of strings from API */
  value?: string | string[] | null
  className?: string
  emptyLabel?: string
}

/** Splits a comma-separated API string or string array into individual chip tags */
const tagColors = [
  'bg-primary/10 text-primary border-primary/20',
  'bg-success/10 text-success border-success/20',
  'bg-accent/10 text-accent border-accent/20',
  'bg-info/10 text-info border-info/20',
  'bg-warning/10 text-warning border-warning/20',
  'bg-destructive/10 text-destructive border-destructive/20',
]

export function TagDisplay({ value, className, emptyLabel = '\u2014' }: TagDisplayProps) {
  let tags: string[] = []
  if (Array.isArray(value)) {
    tags = value.filter(Boolean)
  } else if (value) {
    tags = value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }

  if (tags.length === 0) return <span className="text-sm text-muted-foreground">{emptyLabel}</span>

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag, i) => (
        <span
          key={tag}
          className={cn(
            'inline-flex items-center rounded-full border font-semibold px-3 py-1 text-xs shadow-sm',
            tagColors[i % tagColors.length]
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  )
}
