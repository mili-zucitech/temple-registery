import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AssetField {
  label: string
  value: string
  highlight?: boolean
}

interface DetailedAssetCardProps {
  icon: ReactNode
  fields: AssetField[]
}

export function DetailedAssetCard({ icon, fields }: DetailedAssetCardProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {fields.map((field, index) => (
          <div
            key={index}
            className={cn(
              'rounded-lg border px-3 py-2',
              field.highlight
                ? 'border-primary/30 bg-primary/5'
                : 'border-border/50 bg-gradient-to-br from-background/60 to-muted/20'
            )}
          >
            <div className="mb-1 flex items-center gap-1.5">
              {index === 0 && <span className="text-primary">{icon}</span>}
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {field.label}
              </span>
            </div>
            <p
              className={cn(
                'text-sm font-semibold',
                field.highlight ? 'text-primary' : 'text-foreground'
              )}
            >
              {field.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
