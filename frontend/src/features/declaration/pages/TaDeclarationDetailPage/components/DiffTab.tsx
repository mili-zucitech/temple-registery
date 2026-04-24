import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { SelectVersion } from './SelectVersion'
import { GitCompare } from 'lucide-react'
import type { DeclarationVersionResponse } from '../../../declarationTypes'

interface DiffItem {
  field: string
  oldValue: string | null
  newValue: string | null
}

interface DiffTabProps {
  versions: DeclarationVersionResponse[]
  compareVersion?: number
  onCompareVersionChange: (version: number | undefined) => void
  diff: DiffItem[]
  isLoading: boolean
}

export function DiffTab({
  versions,
  compareVersion,
  onCompareVersionChange,
  diff,
  isLoading,
}: DiffTabProps) {
  return (
    <Card className="border-border/60 bg-card/95 shadow-sm">
      <CardHeader className="flex-row items-start justify-between space-y-0 gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCompare size={16} className="text-primary" />
            Version Comparison
          </CardTitle>
          <CardDescription>Compare the current declaration with a prior version</CardDescription>
        </div>
        <div className="min-w-[220px]">
          <SelectVersion versions={versions} value={compareVersion} onChange={onCompareVersionChange} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : diff.length === 0 ? (
          <EmptyState
            title="No differences"
            description="The selected version matches the current snapshot"
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Field</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Previous</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {diff.map((item, index) => (
                  <tr key={`${item.field}-${index}`} className="transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{item.field.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="rounded bg-red-50 px-2 py-0.5 text-xs line-through">{item.oldValue ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">{item.newValue ?? '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
