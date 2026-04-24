import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FileText, Filter, Plus, Sparkles, ArrowUpRight, Clock3, AlertTriangle, BadgeCheck, LayoutGrid } from 'lucide-react'
import { useListAllDeclarationsQuery, useListDeclarationsQuery } from '../../declarationApi'
import { DECLARATION_STATUSES, type DeclarationResponse } from '../../declarationTypes'
import { getAvailableActions } from '../../declarationPermissions'
import { StatusBadge, DeclarationStatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/app/store'
import { USER_ROLES } from '@/constants/roles'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

function buildFinancialYears(): string[] {
  const now = new Date()
  const startFY = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1
  return Array.from({ length: 4 }, (_, i) => {
    const fy = startFY - i
    return `${fy}-${String(fy + 1).slice(2)}`
  })
}

function getCurrentFinancialYear(): string {
  const now = new Date()
  const startFY = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1
  return `${startFY}-${String(startFY + 1).slice(2)}`
}

export function DeclarationListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = useAppSelector((state) => state.auth.currentUser?.role)
  const templeId = useAppSelector((state) => state.auth.currentUser?.templeId)

  const isDC = role === USER_ROLES.DISTRICT_COLLECTOR || role === USER_ROLES.DC_STAFF || role === USER_ROLES.SUPER_ADMIN
  const isAuditor = role === USER_ROLES.AUDITOR
  const isTA = role === USER_ROLES.TEMPLE_AUTHORITY

  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') ?? '')
  const [fyFilter, setFyFilter] = useState<string>('')

  const financialYears = useMemo(buildFinancialYears, [])
  const currentFY = useMemo(getCurrentFinancialYear, [])

  const dcQuery = useListAllDeclarationsQuery(
    { page, size: DEFAULT_PAGE_SIZE, status: statusFilter || undefined, financialYear: fyFilter || undefined },
    { skip: !isDC && !isAuditor },
  )

  const taQuery = useListDeclarationsQuery(
    { templeId: templeId!, page, size: DEFAULT_PAGE_SIZE },
    { skip: !isTA || !templeId },
  )

  const query = isTA ? taQuery : dcQuery
  const declarations = query.data?.data?.content ?? []
  const totalPages = query.data?.data?.totalPages ?? 0
  const totalElements = query.data?.data?.totalElements ?? 0

  // Check if there's an active declaration for the current financial year
  const hasActiveDeclarationForCurrentYear = useMemo(() => {
    if (!isTA) return false
    return declarations.some(
      (decl) =>
        decl.financialYear === currentFY &&
        ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUIRED', 'CLARIFICATION_RESPONDED',
         'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'VERIFIED', 'APPROVED'].includes(decl.status)
    )
  }, [declarations, currentFY, isTA])

  // Find the existing declaration for current year to show in tooltip
  const existingDeclaration = useMemo(() => {
    if (!hasActiveDeclarationForCurrentYear) return null
    return declarations.find(
      (decl) =>
        decl.financialYear === currentFY &&
        ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUIRED', 'CLARIFICATION_RESPONDED',
         'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'VERIFIED', 'APPROVED'].includes(decl.status)
    )
  }, [declarations, currentFY, hasActiveDeclarationForCurrentYear])



  if (query.isError) {
    return (
      <EmptyState
        title="Unable to load declarations"
        description="We could not fetch the declaration registry right now."
        action={{ label: 'Retry', onClick: () => window.location.reload() }}
      />
    )
  }

  const metrics = buildMetrics(declarations)

  return (
    <div className="space-y-6 pb-8">
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/8 via-card to-secondary/10 shadow-soft-xl">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles size={14} />
                Asset Declaration Center
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Declarations</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Card-based review of temple declarations with version-aware status, due dates, and audit notes.
                </p>
              </div>
            </div>
            {isTA && (
              <div className="relative">
                <Button 
                  className="bg-gradient-gold shadow-gold" 
                  onClick={() => navigate(ROUTE_PATHS.TA_DECLARATION_NEW)}
                  disabled={hasActiveDeclarationForCurrentYear}
                  title={hasActiveDeclarationForCurrentYear 
                    ? `A declaration already exists for FY ${currentFY}. Please update the existing declaration (ID: ${existingDeclaration?.id}).`
                    : 'Create a new declaration for the current financial year'
                  }
                >
                  <Plus size={16} className="mr-2" />
                  New Declaration
                </Button>
                {hasActiveDeclarationForCurrentYear && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Declaration for FY {currentFY} already exists. Update the existing one instead.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total records" value={totalElements} icon={<LayoutGrid size={16} />} />
            <MetricCard label="Draft / Pending" value={metrics.pending} icon={<Clock3 size={16} />} />
            <MetricCard label="Approved" value={metrics.approved} icon={<BadgeCheck size={16} />} />
            <MetricCard label="Overdue" value={metrics.overdue} icon={<AlertTriangle size={16} />} />
          </div>
        </CardContent>
      </Card>

      {(isDC || isAuditor) && (
        <Card className="border-border/60 bg-card/95 shadow-soft-md">
          <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
            <div className="grid flex-1 gap-4 md:grid-cols-2">
              <FilterSelect
                label="Status"
                value={statusFilter || 'all'}
                onChange={(value) => {
                  setStatusFilter(value === 'all' ? '' : value)
                  setPage(0)
                }}
                options={['all', ...DECLARATION_STATUSES].map((status) => ({
                  value: status,
                  label: status === 'all' ? 'All statuses' : status.replace(/_/g, ' '),
                }))}
              />
              <FilterSelect
                label="Financial year"
                value={fyFilter || 'all'}
                onChange={(value) => {
                  setFyFilter(value === 'all' ? '' : value)
                  setPage(0)
                }}
                options={['all', ...financialYears].map((fy) => ({
                  value: fy,
                  label: fy === 'all' ? 'All years' : fy,
                }))}
              />
            </div>
            <Button variant="outline" onClick={() => {
              setStatusFilter('')
              setFyFilter('')
              setPage(0)
            }}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}

      {query.isLoading ? (
        <DeclarationGridSkeleton />
      ) : declarations.length === 0 ? (
        <EmptyState
          title="No declarations found"
          description="Try adjusting filters or create a fresh filing."
          icon={<FileText size={32} />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)]">
          {declarations.map((declaration) => (
            <DeclarationCard
              key={declaration.id}
              declaration={declaration}
              isTA={isTA}
              isDC={isDC}
              isAuditor={isAuditor}
              onOpen={() => navigate(resolveDeclarationRoute({ declaration, isTA, isDC, isAuditor }))}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => setPage((value) => Math.max(value - 1, 0))} disabled={page === 0}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" onClick={() => setPage((value) => value + 1)} disabled={page >= totalPages - 1}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

function DeclarationCard({
  declaration,
  isTA,
  isDC,
  isAuditor,
  onOpen,
}: {
  declaration: DeclarationResponse
  isTA: boolean
  isDC: boolean
  isAuditor: boolean
  onOpen: () => void
}) {
  const overdue = declaration.isOverdue || declaration.overdue || (declaration.dueDate && new Date(declaration.dueDate) < new Date() && !['APPROVED', 'REJECTED', 'SUPERSEDED'].includes(declaration.status))
  const userRole = isTA ? 'TEMPLE_AUTHORITY' : isDC ? 'DISTRICT_COLLECTOR' : ''
  const actions = getAvailableActions(declaration.status, userRole)

  return (
    <Card className={cn('overflow-hidden border-border/60 bg-card/95 shadow-soft-md', overdue && 'border-orange-300/70')}>
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Declaration #{declaration.id}</h2>
              <DeclarationStatusBadge status={declaration.status} isOverdue={declaration.isOverdue || declaration.overdue} />
            </div>
            <p className="text-sm text-muted-foreground">
              {declaration.templeName ?? `Temple #${declaration.templeId}`}
              {declaration.financialYear ? ` · FY ${declaration.financialYear}` : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              Version {declaration.versionNumber ?? 1}
              {declaration.remarks ? ` · ${declaration.remarks}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onOpen}>
              Review
              <ArrowUpRight size={14} className="ml-2" />
            </Button>
            {isTA && actions.canEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpen()}
              >
                Edit draft
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SmallStat label="Submitted" value={formatDate(declaration.submittedAt)} />
          <SmallStat label="Reviewed" value={formatDate(declaration.reviewedAt)} />
          <SmallStat label="Due date" value={formatDate(declaration.dueDate)} emphasize={Boolean(overdue)} />
          <SmallStat label="Ack number" value={declaration.acknowledgementNumber ?? 'Pending'} />
        </div>

        <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryChip label="Agricultural land" value={declaration.agriculturalLandAcres ?? 0} unit="acres" />
          <SummaryChip label="Buildings" value={declaration.buildingsSqft ?? 0} unit="sq ft" />
          <SummaryChip label="Gold" value={declaration.goldGrams ?? 0} unit="g" />
          <SummaryChip label="Vehicles" value={declaration.vehiclesCount ?? 0} unit="items" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{declaration.leasedPropertiesCount ?? 0} leased properties</span>
          <span>{formatCurrency(declaration.financialAssetsValue ?? 0)} in financial assets</span>
          <span>{isDC || isAuditor ? 'DC view' : 'Temple authority view'}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-soft-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-foreground">{value.toLocaleString()}</div>
    </div>
  )
}

function SmallStat({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn('mt-1 text-sm font-medium', emphasize ? 'text-orange-700' : 'text-foreground')}>{value}</div>
    </div>
  )
}

function SummaryChip({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl bg-background/80 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">
        {value.toLocaleString()} {unit}
      </div>
    </div>
  )
}

function DeclarationGridSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="animate-pulse border-border/60">
          <CardContent className="space-y-4 p-5">
            <div className="h-6 w-1/3 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="h-16 rounded-2xl bg-muted" />
              <div className="h-16 rounded-2xl bg-muted" />
              <div className="h-16 rounded-2xl bg-muted" />
              <div className="h-16 rounded-2xl bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function buildMetrics(declarations: DeclarationResponse[]) {
  return {
    pending: declarations.filter((item) => ['DRAFT', 'SUBMITTED', 'CLARIFICATION_REQUIRED', 'CLARIFICATION_RESPONDED', 'UNDER_REVIEW'].includes(item.status)).length,
    approved: declarations.filter((item) => item.status === 'APPROVED').length,
    overdue: declarations.filter((item) => item.status === 'OVERDUE' || item.isOverdue || item.overdue).length,
  }
}

function resolveDeclarationRoute({
  declaration,
  isTA,
  isDC,
  isAuditor,
}: {
  declaration: DeclarationResponse
  isTA: boolean
  isDC: boolean
  isAuditor: boolean
}) {
  if (isDC) return ROUTE_PATHS.DC_DECLARATION_DETAIL.replace(':id', String(declaration.id))
  if (isAuditor) return ROUTE_PATHS.AUDITOR_DECLARATION_DETAIL.replace(':id', String(declaration.id))
  if (isTA) {
    return declaration.status === 'DRAFT'
      ? `${ROUTE_PATHS.TA_DECLARATION_NEW}?id=${declaration.id}`
      : ROUTE_PATHS.TA_DECLARATION_DETAIL.replace(':id', String(declaration.id))
  }
  return ROUTE_PATHS.TA_DECLARATION_DETAIL.replace(':id', String(declaration.id))
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}
