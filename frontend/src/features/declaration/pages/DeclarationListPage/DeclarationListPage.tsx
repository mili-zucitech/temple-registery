import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useListAllDeclarationsQuery } from '../../declarationApi'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { DECLARATION_STATUSES } from '../../declarationTypes'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/app/store'
import { USER_ROLES } from '@/constants/roles'
import { ROUTE_PATHS } from '@/constants/routePaths'

// Generate current + 3 prior financial years (April–March Karnataka FY)
function buildFinancialYears(): string[] {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-indexed
  const year = now.getFullYear()
  const startFY = month >= 4 ? year : year - 1
  return Array.from({ length: 4 }, (_, i) => {
    const fy = startFY - i
    return `${fy}-${String(fy + 1).slice(2)}`
  })
}

export function DeclarationListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = useAppSelector((s) => s.auth.currentUser?.role)
  const isDC = role === USER_ROLES.DISTRICT_COLLECTOR || role === USER_ROLES.DC_STAFF || role === USER_ROLES.SUPER_ADMIN
  const isAuditor = role === USER_ROLES.AUDITOR

  // Pre-fill status from URL (supports dashboard deep-link ?status=PENDING_REVIEW)
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') ?? '')
  const [fyFilter, setFyFilter] = useState<string>('')

  const financialYears = useMemo(() => buildFinancialYears(), [])

  // Debug: Log filter changes
  console.log('[DeclarationsList] Filters changed:', { statusFilter, fyFilter, page })

  const { data, isLoading, isError } = useListAllDeclarationsQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    status: statusFilter || undefined,
    financialYear: fyFilter || undefined,
  })

  const declarations = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0
  const totalElements = data?.data?.totalElements ?? 0

  // Debug: Log API response
  console.log('[DeclarationsList] API Response:', {
    totalElements,
    declarationsCount: declarations.length,
    firstDeclaration: declarations[0] ? {
      id: declarations[0].id,
      financialYear: declarations[0].financialYear,
      templeName: declarations[0].templeName
    } : null
  })

  if (isError) {
    return (
      <EmptyState
        title="Failed to load declarations"
        description="Unable to fetch declaration data. Please try again."
        action={{ label: 'Retry', onClick: () => window.location.reload() }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Declarations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Asset declarations submitted by temple authorities
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 rounded-lg border border-border bg-card p-3 sm:p-4">
        <div className="w-full sm:w-52">
          <label className="text-sm font-medium mb-1 block">Status</label>
          <Select
            value={statusFilter || 'all'}
            onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(0) }}
          >
            <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {DECLARATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-40">
          <label className="text-sm font-medium mb-1 block">Financial Year</label>
          <Select
            value={fyFilter || 'all'}
            onValueChange={(v) => { setFyFilter(v === 'all' ? '' : v); setPage(0) }}
          >
            <SelectTrigger><SelectValue placeholder="All years" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {financialYears.map((fy) => (
                <SelectItem key={fy} value={fy}>{fy}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* "New Declaration" only for Temple Authority — DCs cannot create declarations */}
        {role === USER_ROLES.TEMPLE_AUTHORITY && (
          <Button
            className="bg-gradient-gold shadow-gold w-full sm:w-auto sm:ml-auto"
            onClick={() => navigate(ROUTE_PATHS.TA_DECLARATION_NEW)}
          >
            New Declaration
          </Button>
        )}
      </div>
      {/* Table */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">{totalElements.toLocaleString()} declaration(s)</p>

        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : declarations.length === 0 ? (
          <EmptyState
            title="No declarations found"
            description="No declarations match the selected filters."
            icon={<FileText size={32} />}
          />
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="min-w-[700px] w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">ID</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Temple</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">FY</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Submitted</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Due Date</th>
                  <th className="px-4 py-3 whitespace-nowrap" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {declarations.map((dec) => {
                  const isOverdue = dec.status === 'OVERDUE' ||
                    (dec.dueDate && dec.status === 'PENDING_REVIEW' && new Date(dec.dueDate) < new Date())
                  return (
                    <tr
                      key={dec.id}
                      className={cn(
                        'hover:bg-muted/30 transition-colors',
                        isOverdue && 'bg-destructive/5 border-l-2 border-l-destructive',
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">#{dec.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{dec.templeName ?? `Temple #${dec.templeId}`}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {dec.financialYear ?? '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={dec.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {dec.submittedAt ? new Date(dec.submittedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className={cn(
                        'px-4 py-3 text-xs whitespace-nowrap',
                        isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground',
                      )}>
                        {dec.dueDate ? new Date(dec.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-w-[64px]"
                          onClick={() => {
                            // DC/DC_STAFF/SUPER_ADMIN: go to temple profile (correct workflow)
                            // Auditor: read-only temple profile
                            // TA: go to TA standalone detail page
                            if (isDC) {
                              navigate(
                                ROUTE_PATHS.DC_TEMPLE_DETAIL.replace(':templeId', String(dec.templeId)),
                              )
                            } else if (isAuditor) {
                              navigate(
                                ROUTE_PATHS.AUDITOR_TEMPLE_DETAIL.replace(':templeId', String(dec.templeId)),
                              )
                            } else {
                              navigate(ROUTE_PATHS.TA_DECLARATION_DETAIL.replace(':id', String(dec.id)))
                            }
                          }}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
