import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  description?: string
  className?: string
}

export function KpiCard({ title, value, icon, trend, description, className }: KpiCardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-5 shadow-soft-sm flex items-start gap-4', className)}>
      {icon && (
        <div className="p-2 rounded-md bg-gradient-gold shadow-gold text-white flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{title}</p>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        {trend && (
          <p className={cn(
            'text-xs mt-1 font-medium',
            trend.direction === 'up' && 'text-success',
            trend.direction === 'down' && 'text-destructive',
            trend.direction === 'neutral' && 'text-muted-foreground'
          )}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.value}% {trend.label}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  )
}
