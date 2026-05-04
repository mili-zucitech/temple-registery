import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FileText, Filter, Plus, Sparkles, ArrowUpRight, Clock, Clock3, AlertTriangle, BadgeCheck, LayoutGrid, FileCheck2, Info } from 'lucide-react'
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
  // Disable new declaration if there's any non-terminal status declaration
  const hasActiveDeclarationForCurrentYear = useMemo(() => {
    if (!isTA) return false
    return declarations.some(
      (decl) =>
        decl.financialYear === currentFY &&
        // Allow new declaration only if all declarations are REJECTED or SUPERSEDED
        // APPROVED is terminal but should also block new declarations
        !['REJECTED', 'SUPERSEDED'].includes(decl.status)
    )
  }, [declarations, currentFY, isTA])

  // Find the existing declaration for current year to show in tooltip
  const existingDeclaration = useMemo(() => {
    if (!hasActiveDeclarationForCurrentYear) return null
    return declarations.find(
      (decl) =>
        decl.financialYear === currentFY &&
        !['REJECTED', 'SUPERSEDED'].includes(decl.status)
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
    <div className="space-y-5 pb-8">
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/5 via-card to-secondary/5 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <FileCheck2 size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Declarations</h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Track asset declarations and review status
                </p>
              </div>
            </div>
            {isTA && (
              <div className="flex flex-col items-end gap-2">
                <Button 
                  className="bg-gradient-gold shadow-gold" 
                  onClick={() => navigate(ROUTE_PATHS.TA_DECLARATION_NEW)}
                  disabled={hasActiveDeclarationForCurrentYear}
                  title={hasActiveDeclarationForCurrentYear 
                    ? `A declaration for FY ${currentFY} already exists (ID: ${existingDeclaration?.id}, Status: ${existingDeclaration?.status}). You can only have one active declaration per financial year.`
                    : 'Create a new declaration for the current financial year'
                  }
                >
                  <Plus size={16} className="mr-2" />
                  New Declaration
                </Button>
                {hasActiveDeclarationForCurrentYear && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow-sm">
                    <Info size={14} className="shrink-0" />
                    <span>
                      Declaration for FY {currentFY} already exists (Status: {existingDeclaration?.status}). 
                      {existingDeclaration?.status === 'REJECTED' 
                        ? ' Please update and resubmit the rejected declaration.' 
                        : ' Update the existing one instead.'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total records" value={totalElements} icon={<LayoutGrid size={18} />} variant="default" />
            <MetricCard label="Draft / Pending" value={metrics.pending} icon={<Clock3 size={18} />} variant="warning" />
            <MetricCard label="Approved" value={metrics.approved} icon={<BadgeCheck size={18} />} variant="success" />
            <MetricCard label="Overdue" value={metrics.overdue} icon={<AlertTriangle size={18} />} variant="danger" />
          </div>
        </CardContent>
      </Card>

      {(isDC || isAuditor) && (
        <Card className="border-border/60 bg-card/95 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
            <div className="grid flex-1 gap-3 md:grid-cols-2">
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
            <Button variant="outline" size="sm" onClick={() => {
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
    <Card className={cn(
      'group overflow-hidden border-border/60 bg-card/95 shadow-sm transition-all hover:shadow-md hover:border-primary/30',
      overdue && 'border-l-4 border-l-orange-500'
    )}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Declaration #{declaration.id}</h2>
              <StatusBadge status={declaration.status} />
              {overdue && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-800">
                  <AlertTriangle size={10} />
                  Overdue
                </span>
              )}
              {isTA && declaration.status === 'CLARIFICATION_REQUIRED' && (
                <span className="inline-flex items-center gap-1 rounded-sm border border-orange-300 bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-800 uppercase tracking-label">
                  <Clock size={10} aria-hidden />
                  ACTION REQ.
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{declaration.templeName ?? `Temple #${declaration.templeId}`}</span>
              {declaration.financialYear && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                    <FileText size={12} />
                    FY {declaration.financialYear}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="group-hover:border-primary/50 group-hover:bg-primary/5 hover:text-foreground" onClick={onOpen}>
              {isDC || isAuditor ? 'Review' : 'View Details'}
              <ArrowUpRight size={14} className="ml-1.5" />
            </Button>
            {isTA && actions.canEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpen()}
              >
                {declaration.status === 'REJECTED' ? 'Update' : 'Edit draft'}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <CompactStat label="Submitted" value={formatDate(declaration.submittedAt)} />
          <CompactStat label="Reviewed" value={formatDate(declaration.reviewedAt)} />
          <CompactStat label="Due date" value={formatDate(declaration.dueDate)} emphasize={Boolean(overdue)} />
          <CompactStat label="Ack number" value={declaration.acknowledgementNumber ?? 'Pending'} />
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

function MetricCard({ label, value, icon, variant = 'default' }: { 
  label: string; 
  value: number; 
  icon: ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'danger';
}) {
  const variantStyles = {
    default: 'from-slate-50 to-slate-100 border-slate-200 text-slate-700',
    warning: 'from-amber-50 to-amber-100 border-amber-200 text-amber-700',
    success: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700',
    danger: 'from-rose-50 to-rose-100 border-rose-200 text-rose-700',
  }

  const iconStyles = {
    default: 'bg-slate-100 text-slate-600',
    warning: 'bg-amber-100 text-amber-600',
    success: 'bg-emerald-100 text-emerald-600',
    danger: 'bg-rose-100 text-rose-600',
  }

  return (
    <div className={cn(
      'group relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 shadow-sm transition-all hover:shadow-md',
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-[10px] font-medium uppercase tracking-wider opacity-70">{label}</div>
          <div className="mt-2 text-2xl font-bold">{value.toLocaleString()}</div>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110', iconStyles[variant])}>
          {icon}
        </div>
      </div>
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
    </div>
  )
}

function CompactStat({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={cn(
      'rounded-lg border bg-gradient-to-br px-3 py-2 transition-colors',
      emphasize 
        ? 'border-orange-200 from-orange-50 to-orange-100' 
        : 'border-border/50 from-background/60 to-muted/30'
    )}>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn('mt-0.5 text-xs font-semibold', emphasize ? 'text-orange-700' : 'text-foreground')}>{value}</div>
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
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="animate-pulse border-border/60">
          <CardContent className="space-y-3 p-4">
            <div className="h-5 w-1/3 rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="h-12 rounded-lg bg-muted" />
              <div className="h-12 rounded-lg bg-muted" />
              <div className="h-12 rounded-lg bg-muted" />
              <div className="h-12 rounded-lg bg-muted" />
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
    // Allow editing for both DRAFT and REJECTED statuses
    return (declaration.status === 'DRAFT' || declaration.status === 'REJECTED')
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
