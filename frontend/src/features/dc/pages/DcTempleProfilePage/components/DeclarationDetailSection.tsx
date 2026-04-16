import type { DeclarationDetailResponse } from '@/features/dc/dcTypes'
import {
  Trees,
  Building2,
  Map,
  Coins,
  CircleDot,
  Car,
  Landmark,
  Banknote,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  IndianRupee
} from 'lucide-react'

interface DeclarationDetailSectionProps {
  declaration: DeclarationDetailResponse
}

export function DeclarationDetailSection({ declaration }: DeclarationDetailSectionProps) {
  // Compute total assets
  const totalAssets =
    (declaration.agriculturalLandValue ?? 0) +
    (declaration.buildingsValue ?? 0) +
    (declaration.financialAssetsValue ?? 0) +
    (declaration.otherMovableValue ?? 0)

  return (
    <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Summary Card */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
          Declaration Summary
        </h3>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5" />
              Total Assets
            </dt>
            <dd className="text-lg font-bold text-foreground">
              {formatCurrency(totalAssets)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Financial Year
            </dt>
            <dd className="font-medium">{declaration.financialYear}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Submitted
            </dt>
            <dd>{declaration.submittedAt ? formatDate(declaration.submittedAt) : '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Due Date
            </dt>
            <dd className={declaration.overdue ? 'text-destructive font-medium' : ''}>
              {declaration.dueDate ? formatDate(declaration.dueDate) : '—'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Immovable Assets */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Map className="h-4 w-4 text-muted-foreground" />
          Immovable Assets
        </h3>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs flex items-center gap-1.5">
              <Trees className="h-3.5 w-3.5" />
              Agricultural Land
            </dt>
            <dd className="font-medium">{fmt(declaration.agriculturalLandAcres, 'acres')}</dd>
            <dd className="text-xs text-muted-foreground">{formatCurrency(declaration.agriculturalLandValue)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Buildings
            </dt>
            <dd className="font-medium">{fmt(declaration.buildingsSqft, 'sq ft')}</dd>
            <dd className="text-xs text-muted-foreground">{formatCurrency(declaration.buildingsValue)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs flex items-center gap-1.5">
              <Map className="h-3.5 w-3.5" />
              Other Land
            </dt>
            <dd className="font-medium">—</dd>
            <dd className="text-xs text-muted-foreground">{formatCurrency(declaration.otherLandValue)}</dd>
          </div>
        </dl>
      </div>

      {/* Movable Assets */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          Movable Assets
        </h3>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5" />
              Gold
            </dt>
            <dd className="font-medium">{fmt(declaration.goldGrams, 'g')}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs flex items-center gap-1.5">
              <CircleDot className="h-3.5 w-3.5" />
              Silver
            </dt>
            <dd className="font-medium">{fmt(declaration.silverGrams, 'g')}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5" />
              Idols
            </dt>
            <dd className="font-medium">{fmt(declaration.idolsCount)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5" />
              Vehicles
            </dt>
            <dd className="font-medium">{fmt(declaration.vehiclesCount)}</dd>
          </div>
        </dl>
      </div>

      {/* Financial & Other */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Banknote className="h-4 w-4 text-muted-foreground" />
          Financial Assets
        </h3>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5" />
              Financial Assets
            </dt>
            <dd className="font-medium">{formatCurrency(declaration.financialAssetsValue)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Other Movable
            </dt>
            <dd className="font-medium">{formatCurrency(declaration.otherMovableValue)}</dd>
          </div>
        </dl>
      </div>

      {/* Metadata */}
      {declaration.acknowledgementNumber && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Metadata
          </h3>
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                Acknowledgement
              </dt>
              <dd className="font-mono">{declaration.acknowledgementNumber}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                Reviewed At
              </dt>
              <dd>{declaration.reviewedAt ? formatDate(declaration.reviewedAt) : '—'}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}

// Helper functions
function formatCurrency(v: number | null | undefined): string {
  if (v == null) return 'Not Declared'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(v)
}

function fmt(v: number | null | undefined, unit = ''): string {
  if (v == null) return 'Not Declared'
  return `${v.toLocaleString('en-IN')}${unit ? ' ' + unit : ''}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
