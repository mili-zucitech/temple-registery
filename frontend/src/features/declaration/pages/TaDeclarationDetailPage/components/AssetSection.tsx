import type { ReactNode } from 'react'

interface AssetSectionProps<T> {
  title: string
  items: T[]
  renderItem: (item: T) => ReactNode
}

export function AssetSection<T>({ title, items, renderItem }: AssetSectionProps<T>) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{items.length} item(s)</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
          No entries recorded.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-2xl border border-border/60 bg-background/80 p-4">
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
