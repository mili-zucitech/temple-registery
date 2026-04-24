import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { cn } from '@/lib/utils'
import { History } from 'lucide-react'
import type { DeclarationStatus, DeclarationVersionResponse } from '../../../declarationTypes'

interface HistoryTabProps {
  versions: DeclarationVersionResponse[]
  activeVersion?: DeclarationVersionResponse
  onVersionSelect: (versionNumber: number) => void
}

export function HistoryTab({ versions, activeVersion, onVersionSelect }: HistoryTabProps) {
  return (
    <Card className="border-border/60 bg-card/95 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History size={16} className="text-primary" />
          Version History
        </CardTitle>
        <CardDescription>Select a version to compare against the current declaration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {versions.map((version) => (
          <VersionTimelineCard
            key={version.id}
            version={version}
            selected={version.versionNumber === activeVersion?.versionNumber}
            onSelect={() => onVersionSelect(version.versionNumber)}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function VersionTimelineCard({
  version,
  selected,
  onSelect,
}: {
  version: DeclarationVersionResponse
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-lg border p-3 text-left transition-all duration-200',
        selected ? 'border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'border-border/60 bg-background/80 hover:bg-muted/30'
      )}
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Version {version.versionNumber}</p>
            <StatusBadge status={(version.status ?? 'DRAFT') as DeclarationStatus} />
          </div>
          <p className="text-xs text-muted-foreground">
            Submitted {formatDate(version.submittedAt)} · Reviewed {formatDate(version.reviewedAt)}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {version.acknowledgementNumber ? `Ack ${version.acknowledgementNumber}` : 'Awaiting acknowledgement'}
        </div>
      </div>
      {version.remarks && (
        <p className="mt-2 rounded-md bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground">{version.remarks}</p>
      )}
    </button>
  )
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN')
}
