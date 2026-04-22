import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { cn } from '@/lib/utils'
import type { CompleteDeclarationResponse, DeclarationStatus, DeclarationVersionResponse } from '../../../declarationTypes'

interface OverviewTabProps {
  declaration: CompleteDeclarationResponse
  versions: DeclarationVersionResponse[]
  activeVersion?: DeclarationVersionResponse
  onVersionSelect: (versionNumber: number) => void
}

export function OverviewTab({ declaration, versions, activeVersion, onVersionSelect }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/95 shadow-soft-md">
          <CardHeader>
            <CardTitle className="text-base">Workflow summary</CardTitle>
            <CardDescription>Key submission and review timestamps.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Submitted" value={formatDate(declaration.submittedAt)} />
            <DetailRow label="Reviewed" value={formatDate(declaration.reviewedAt)} />
            <DetailRow label="Acknowledged" value={formatDate(declaration.acknowledgedAt)} />
            <DetailRow
              label="Reviewed by"
              value={declaration.reviewedBy ? `User #${declaration.reviewedBy}` : 'Not reviewed'}
            />
            <DetailRow label="Remarks" value={declaration.remarks ?? 'No remarks recorded'} />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/95 shadow-soft-md">
          <CardHeader>
            <CardTitle className="text-base">Asset totals</CardTitle>
            <CardDescription>Snapshot of the headline figures.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <MetricBox label="Agricultural acres" value={declaration.agriculturalLandAcres} />
            <MetricBox label="Buildings" value={declaration.buildingsSqft} unit="sq ft" />
            <MetricBox label="Gold" value={declaration.goldGrams} unit="g" />
            <MetricBox label="Financial assets" value={declaration.financialAssetsValue} money />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/95 shadow-soft-md">
        <CardHeader>
          <CardTitle className="text-base">Submission timeline</CardTitle>
          <CardDescription>Versions submitted for this declaration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {versions.length === 0 ? (
            <EmptyState title="No version history" description="This declaration has not been versioned yet." />
          ) : (
            <div className="grid gap-3">
              {versions.map((version) => (
                <VersionTimelineCard
                  key={version.id}
                  version={version}
                  selected={version.versionNumber === activeVersion?.versionNumber}
                  onSelect={() => onVersionSelect(version.versionNumber)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

function MetricBox({
  label,
  value,
  unit,
  money,
}: {
  label: string
  value: number | null | undefined
  unit?: string
  money?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">
        {money ? formatCurrency(value ?? 0) : `${(value ?? 0).toLocaleString()}${unit ? ` ${unit}` : ''}`}
      </p>
    </div>
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
        'w-full rounded-2xl border p-4 text-left transition-all duration-200',
        selected ? 'border-primary/30 bg-primary/5 shadow-soft-md' : 'border-border/60 bg-background/80'
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
      {version.remarks && <p className="mt-3 text-sm text-muted-foreground">{version.remarks}</p>}
    </button>
  )
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}
