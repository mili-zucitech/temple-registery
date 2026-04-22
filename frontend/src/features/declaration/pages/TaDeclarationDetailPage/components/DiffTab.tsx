import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { SelectVersion } from './SelectVersion'
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
    <Card className="border-border/60 bg-card/95 shadow-soft-md">
      <CardHeader className="flex-row items-start justify-between space-y-0 gap-3">
        <div>
          <CardTitle className="text-base">Version comparison</CardTitle>
          <CardDescription>Compare the current declaration with a prior version.</CardDescription>
        </div>
        <div className="min-w-[220px]">
          <SelectVersion versions={versions} value={compareVersion} onChange={onCompareVersionChange} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : diff.length === 0 ? (
          <EmptyState
            title="No differences"
            description="The selected version matches the current snapshot."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Field</th>
                  <th className="px-4 py-3 text-left font-semibold">Previous</th>
                  <th className="px-4 py-3 text-left font-semibold">Current</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {diff.map((item, index) => (
                  <tr key={`${item.field}-${index}`} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{item.field.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-muted-foreground line-through">
                      {item.oldValue ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-foreground">{item.newValue ?? '—'}</td>
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
