import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AssetGroupProps {
  title: string
  icon: ReactNode
  children: ReactNode
}

export function AssetGroup({ title, icon, children }: AssetGroupProps) {
  return (
    <Card className="border-border/60 bg-card/95 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  )
}
