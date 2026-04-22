interface AssetLineProps {
  title: string
  subtitle: string
  value: string
}

export function AssetLine({ title, subtitle, value }: AssetLineProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <p className="text-xs font-medium text-muted-foreground">{value}</p>
    </div>
  )
}
