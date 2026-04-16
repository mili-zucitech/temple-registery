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
      'rounded-xl border border-border bg-gradient-to-br from-card/90 via-muted/60 to-card shadow-soft-md',
      'transition-shadow hover:shadow-lg',
      className
    )}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40 rounded-t-xl">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="px-4 py-3 space-y-3">{children}</div>
    </div>
  )
}
