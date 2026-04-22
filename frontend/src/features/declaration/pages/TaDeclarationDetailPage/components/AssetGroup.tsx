import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AssetGroupProps {
  title: string
  icon: ReactNode
  children: ReactNode
}

export function AssetGroup({ title, icon, children }: AssetGroupProps) {
  return (
    <Card className="border-border/60 bg-card/95 shadow-soft-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="rounded-xl bg-primary/10 p-2 text-primary">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
