import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: string
  icon?: ReactNode
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function SectionCard({ title, icon, children, className, action }: SectionCardProps) {
  return (
    <div className={cn(
      'rounded-xl border border-border bg-gradient-to-br from-card via-card/95 to-muted/30 shadow-md',
      'transition-all duration-200 hover:shadow-lg hover:border-border/80',
      className
    )}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-gradient-to-r from-muted/50 to-muted/30 rounded-t-xl">
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-primary flex-shrink-0">{icon}</span>}
          <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}
