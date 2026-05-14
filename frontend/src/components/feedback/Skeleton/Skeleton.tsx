import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      style={style}
    />
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

/** Renders skeleton rows that match the structure of an actual data table. */
export function TableBodySkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  const widths = ['w-24', 'w-32', 'w-20', 'w-28', 'w-16', 'w-36', 'w-24', 'w-20']
  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card shadow-sm">
      {/* Header row */}
      <div className="bg-muted/40 border-b border-border px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={cn('h-3 rounded', widths[i % widths.length])} />
        ))}
      </div>
      {/* Body rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton
                key={j}
                className={cn('h-4 rounded', widths[(i + j) % widths.length])}
                style={{ opacity: 1 - i * 0.06 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6 space-y-4 shadow-soft-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-8 w-1/2 rounded-lg" />
      <Skeleton className="h-3 w-full rounded-md" />
    </div>
  )
}
