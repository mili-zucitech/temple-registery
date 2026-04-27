import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { cn } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Building2, Landmark, Coins, TrendingUp, FileText, Calendar } from 'lucide-react'
import type { CompleteDeclarationResponse, DeclarationStatus, DeclarationVersionResponse } from '../../../declarationTypes'
import { ChatPanel } from '@/features/declaration/components/ChatPanel'

interface OverviewTabProps {
  declaration: CompleteDeclarationResponse
  versions: DeclarationVersionResponse[]
  activeVersion?: DeclarationVersionResponse
  onVersionSelect: (versionNumber: number) => void
  declarationId: number
  declarationStatus: DeclarationStatus
}

export function OverviewTab({ declaration, versions, activeVersion, onVersionSelect, declarationId, declarationStatus }: OverviewTabProps) {
  // Prepare data for charts
  const assetDistribution = [
    { name: 'Agricultural Land', value: declaration.agriculturalLands.length, color: '#10b981' },
    { name: 'Buildings', value: declaration.buildings.length, color: '#3b82f6' },
    { name: 'Precious Metals', value: declaration.preciousMetals.length, color: '#f59e0b' },
    { name: 'Vehicles', value: declaration.vehicles.length, color: '#8b5cf6' },
    { name: 'Equipment', value: declaration.equipment.length, color: '#ec4899' },
    { name: 'Financial Assets', value: declaration.financialAssets.length, color: '#06b6d4' },
  ].filter(item => item.value > 0)

  const financialData = [
    { name: 'Income', value: declaration.annualIncome ?? 0 },
    { name: 'Expenditure', value: declaration.annualExpenditure ?? 0 },
  ]

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          label="Agricultural Land" 
          value={declaration.agriculturalLandAcres ?? 0} 
          unit="acres"
          icon={<Landmark size={18} />}
          variant="success"
        />
        <MetricCard 
          label="Buildings" 
          value={declaration.buildingsSqft ?? 0} 
          unit="sq ft"
          icon={<Building2 size={18} />}
          variant="info"
        />
        <MetricCard 
          label="Gold" 
          value={declaration.goldGrams ?? 0} 
          unit="g"
          icon={<Coins size={18} />}
          variant="warning"
        />
        <MetricCard 
          label="Financial Assets" 
          value={declaration.financialAssetsValue ?? 0} 
          money
          icon={<TrendingUp size={18} />}
          variant="primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Asset Distribution Chart */}
        {assetDistribution.length > 0 && (
          <Card className="border-border/60 bg-card/95 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Asset Distribution</CardTitle>
              <CardDescription>Breakdown of asset categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={assetDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Financial Overview */}
        {(declaration.annualIncome || declaration.annualExpenditure) && (
          <Card className="border-border/60 bg-card/95 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Financial Overview</CardTitle>
              <CardDescription>Annual income vs expenditure</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Workflow Summary */}
        <Card className="border-border/60 bg-card/95 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              Workflow Summary
            </CardTitle>
            <CardDescription>Key submission and review timestamps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <CompactDetailRow label="Submitted" value={formatDate(declaration.submittedAt)} />
            <CompactDetailRow label="Reviewed" value={formatDate(declaration.reviewedAt)} />
            <CompactDetailRow label="Acknowledged" value={formatDate(declaration.acknowledgedAt)} />
            <CompactDetailRow
              label="Reviewed by"
              value={declaration.reviewedBy ? `User #${declaration.reviewedBy}` : 'Not reviewed'}
            />
            {declaration.remarks && (
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Remarks</div>
                <div className="text-xs text-foreground">{declaration.remarks}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Asset Summary */}
        <Card className="border-border/60 bg-card/95 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              Asset Summary
            </CardTitle>
            <CardDescription>Count of assets by category</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <CompactMetric label="Agricultural Lands" value={declaration.agriculturalLands.length} />
            <CompactMetric label="Buildings" value={declaration.buildings.length} />
            <CompactMetric label="Leased Properties" value={declaration.leasedProperties.length} />
            <CompactMetric label="Other Lands" value={declaration.otherLands.length} />
            <CompactMetric label="Precious Metals" value={declaration.preciousMetals.length} />
            <CompactMetric label="Artifacts" value={declaration.artifacts.length} />
            <CompactMetric label="Vehicles" value={declaration.vehicles.length} />
            <CompactMetric label="Equipment" value={declaration.equipment.length} />
          </CardContent>
        </Card>
      </div>

      {/* Version Timeline */}
      <Card className="border-border/60 bg-card/95 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Submission Timeline</CardTitle>
          <CardDescription>Versions submitted for this declaration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {versions.length === 0 ? (
            <EmptyState title="No version history" description="This declaration has not been versioned yet." />
          ) : (
            <div className="grid gap-2.5">
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

      {/* Unified Chat Panel */}
      <ChatPanel
        declarationId={declarationId}
        declarationStatus={declarationStatus}
        readonly={false}
      />
    </div>
  )
}

function MetricCard({ 
  label, 
  value, 
  unit, 
  money, 
  icon,
  variant = 'default'
}: { 
  label: string; 
  value: number; 
  unit?: string; 
  money?: boolean;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'info' | 'warning' | 'primary';
}) {
  const variantStyles = {
    default: 'from-slate-50 to-slate-100 border-slate-200 text-slate-700',
    success: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700',
    info: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
    warning: 'from-amber-50 to-amber-100 border-amber-200 text-amber-700',
    primary: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
  }

  const iconStyles = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-600',
    info: 'bg-blue-100 text-blue-600',
    warning: 'bg-amber-100 text-amber-600',
    primary: 'bg-purple-100 text-purple-600',
  }

  return (
    <div className={cn(
      'group relative overflow-hidden rounded-xl border bg-gradient-to-br p-3.5 shadow-sm transition-all hover:shadow-md',
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-[10px] font-medium uppercase tracking-wider opacity-70">{label}</div>
          <div className="mt-1.5 text-xl font-bold">
            {money ? formatCurrency(value) : `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`}
          </div>
        </div>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110', iconStyles[variant])}>
          {icon}
        </div>
      </div>
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/20 blur-2xl" />
    </div>
  )
}

function CompactDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-gradient-to-br from-background/60 to-muted/20 px-3 py-2">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  )
}

function CompactMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/50 bg-gradient-to-br from-background/60 to-muted/20 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-foreground">{value}</div>
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}
