import type { ReactNode } from 'react'

interface AssetSectionProps<T> {
  title: string
  items: T[]
  renderItem: (item: T) => ReactNode
}

export function AssetSection<T>({ title, items, renderItem }: AssetSectionProps<T>) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-3 text-center text-xs text-muted-foreground">
          No entries recorded
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="rounded-lg border border-border/60 bg-gradient-to-br from-background/80 to-muted/20 p-3 transition-colors hover:bg-muted/30">
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
