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

export function KpiCard({ title, value, icon, trend, description, className, onClick }: KpiCardProps & { onClick?: () => void }) {
  const CardWrapper = onClick ? 'button' : 'div'

  return (
    <CardWrapper
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-6 shadow-soft-sm flex items-start gap-4 transition-all duration-300 group',
        onClick && 'hover:-translate-y-1 hover:shadow-soft-lg hover:border-primary/50 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" aria-hidden />
      
      {icon && (
        <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0 transition-transform group-hover:scale-110 duration-300">
          {icon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 transition-colors group-hover:text-primary/80">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-display font-bold text-foreground leading-none tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <span className={cn(
              'text-xs font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5',
              trend.direction === 'up' && 'bg-success/10 text-success',
              trend.direction === 'down' && 'bg-destructive/10 text-destructive',
              trend.direction === 'neutral' && 'bg-muted/10 text-muted-foreground'
            )}>
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
              {trend.value}%
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2 font-medium leading-relaxed line-clamp-1">
            {description}
          </p>
        )}
      </div>
    </CardWrapper>
  )
}
