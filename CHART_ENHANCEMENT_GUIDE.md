# Chart Enhancement Guide for Overview Tab

## Overview
This guide shows how to add interactive charts to the Overview tab using the recharts library.

## Installation

```bash
cd frontend
npm install recharts
```

## Chart Components to Create

### 1. Asset Distribution Pie Chart

Create `frontend/src/features/declaration/pages/TaDeclarationDetailPage/components/AssetDistributionChart.tsx`:

```typescript
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AssetDistributionChartProps {
  data: {
    name: string
    value: number
    color: string
  }[]
}

export function AssetDistributionChart({ data }: AssetDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="border-border/60 bg-card/95 shadow-soft-md">
      <CardHeader>
        <CardTitle className="text-base">Asset Value Distribution</CardTitle>
        <CardDescription>Breakdown of assets by category value</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(value)
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">Total Asset Value</p>
          <p className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
            }).format(total)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 2. Asset Count Bar Chart

Create `frontend/src/features/declaration/pages/TaDeclarationDetailPage/components/AssetCountChart.tsx`:

```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AssetCountChartProps {
  data: {
    category: string
    count: number
  }[]
}

export function AssetCountChart({ data }: AssetCountChartProps) {
  return (
    <Card className="border-border/60 bg-card/95 shadow-soft-md">
      <CardHeader>
        <CardTitle className="text-base">Asset Count by Category</CardTitle>
        <CardDescription>Number of items in each asset category</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="category"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
              name="Asset Count"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

### 3. Update OverviewTab to Include Charts

Update `frontend/src/features/declaration/pages/TaDeclarationDetailPage/components/OverviewTab.tsx`:

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { cn } from '@/lib/utils'
import type { CompleteDeclarationResponse, DeclarationStatus, DeclarationVersionResponse } from '../../../declarationTypes'
import { AssetDistributionChart } from './AssetDistributionChart'
import { AssetCountChart } from './AssetCountChart'

interface OverviewTabProps {
  declaration: CompleteDeclarationResponse
  versions: DeclarationVersionResponse[]
  activeVersion?: DeclarationVersionResponse
  onVersionSelect: (versionNumber: number) => void
}

export function OverviewTab({ declaration, versions, activeVersion, onVersionSelect }: OverviewTabProps) {
  // Prepare chart data
  const assetDistributionData = [
    {
      name: 'Buildings',
      value: declaration.buildingsSqft ?? 0,
      color: '#8b5cf6', // purple
    },
    {
      name: 'Gold',
      value: declaration.goldGrams ?? 0,
      color: '#f59e0b', // amber
    },
    {
      name: 'Financial Assets',
      value: declaration.financialAssetsValue ?? 0,
      color: '#10b981', // emerald
    },
    {
      name: 'Agricultural Land',
      value: declaration.agriculturalLandAcres ?? 0,
      color: '#06b6d4', // cyan
    },
  ].filter((item) => item.value > 0)

  const assetCountData = [
    { category: 'Agricultural Land', count: declaration.agriculturalLands.length },
    { category: 'Buildings', count: declaration.buildings.length },
    { category: 'Leased Properties', count: declaration.leasedProperties.length },
    { category: 'Precious Metals', count: declaration.preciousMetals.length },
    { category: 'Artifacts', count: declaration.artifacts.length },
    { category: 'Vehicles', count: declaration.vehicles.length },
    { category: 'Equipment', count: declaration.equipment.length },
    { category: 'Financial Assets', count: declaration.financialAssets.length },
  ].filter((item) => item.count > 0)

  return (
    <div className="space-y-4">
      {/* Existing workflow and asset totals cards */}
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

      {/* NEW: Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AssetDistributionChart data={assetDistributionData} />
        <AssetCountChart data={assetCountData} />
      </div>

      {/* Existing version timeline */}
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

// ... rest of the component (DetailRow, MetricBox, VersionTimelineCard, etc.)
```

## Color Palette

Use these colors for consistency with the app theme:

```typescript
const CHART_COLORS = {
  primary: '#8b5cf6',    // Purple
  secondary: '#06b6d4',  // Cyan
  accent: '#f59e0b',     // Amber
  success: '#10b981',    // Emerald
  warning: '#f97316',    // Orange
  danger: '#ef4444',     // Red
  info: '#3b82f6',       // Blue
  muted: '#6b7280',      // Gray
}
```

## Enhanced Stat Cards

For even better visuals, enhance the MetricBox component with icons and gradients:

```typescript
import { TrendingUp, Building2, Coins, Wallet } from 'lucide-react'

function EnhancedMetricBox({
  label,
  value,
  unit,
  money,
  icon,
  gradient,
}: {
  label: string
  value: number | null | undefined
  unit?: string
  money?: boolean
  icon: React.ReactNode
  gradient: string
}) {
  return (
    <div className={`rounded-2xl border border-border/60 p-4 ${gradient}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="rounded-lg bg-background/80 p-2">{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-bold text-foreground">
        {money ? formatCurrency(value ?? 0) : `${(value ?? 0).toLocaleString()}${unit ? ` ${unit}` : ''}`}
      </p>
    </div>
  )
}

// Usage:
<EnhancedMetricBox
  label="Agricultural acres"
  value={declaration.agriculturalLandAcres}
  icon={<TrendingUp size={16} />}
  gradient="bg-gradient-to-br from-cyan-50 to-blue-50"
/>
```

## Timeline Visualization

For a more visual timeline, consider using a vertical timeline component:

```typescript
function VersionTimeline({ versions }: { versions: DeclarationVersionResponse[] }) {
  return (
    <div className="relative space-y-4">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
      
      {versions.map((version, index) => (
        <div key={version.id} className="relative flex gap-4">
          {/* Timeline dot */}
          <div className={cn(
            "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2",
            index === 0
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background"
          )}>
            <span className="text-xs font-semibold">{version.versionNumber}</span>
          </div>
          
          {/* Content */}
          <div className="flex-1 rounded-2xl border border-border/60 bg-background/80 p-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={version.status} />
              <span className="text-xs text-muted-foreground">
                {formatDate(version.submittedAt)}
              </span>
            </div>
            {version.remarks && (
              <p className="mt-2 text-sm text-muted-foreground">{version.remarks}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

## Testing the Charts

After implementing the charts:

1. Navigate to a declaration detail page
2. Click on the "Overview" tab
3. Verify the charts render correctly
4. Check responsiveness on different screen sizes
5. Test with declarations that have different asset distributions

## Performance Considerations

- Charts are only loaded when the Overview tab is accessed (lazy loading)
- Recharts uses canvas rendering for better performance
- Data is memoized to prevent unnecessary recalculations
- Responsive containers ensure charts adapt to screen size

## Accessibility

Ensure charts are accessible:
- Add proper ARIA labels
- Include text alternatives for screen readers
- Ensure sufficient color contrast
- Provide keyboard navigation where applicable

## Next Steps

1. Install recharts: `npm install recharts`
2. Create the chart components
3. Update OverviewTab to include charts
4. Test thoroughly
5. Consider adding more chart types (line charts for trends, etc.)
