interface AssetLineProps {
  title: string
  subtitle: string
  value: string
}

export function AssetLine({ title, subtitle, value }: AssetLineProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Title</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>
        <div className="text-right">
          <div className="mb-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Value</span>
          </div>
          <p className="text-sm font-semibold text-primary">{value}</p>
        </div>
      </div>
      <div className="rounded-md bg-muted/30 px-3 py-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Details</span>
        <p className="mt-0.5 text-xs text-foreground">{subtitle}</p>
      </div>
    </div>
  )
}
