import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetWorkflowDashboardQuery, useGetPendingCountQuery } from '@/features/governance/workflowApi'
import { useAppSelector } from '@/app/store'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { WorkflowStatusBadge } from '@/features/governance/WorkflowStatusBadge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import type { WorkflowInstance } from '@/types/workflow'

const PAGE_SIZE = 10

const ENTITY_TYPE_LABELS: Record<string, string> = {
  TRUST: 'Trust',
  DECLARATION: 'Declaration',
  TEMPLE_PROFILE: 'Temple Profile',
  BOARD_MEMBER: 'Board Member',
}

function WorkflowRow({ instance }: { instance: WorkflowInstance }) {
  const navigate = useNavigate()

  const handleView = () => {
    switch (instance.entityType) {
      case 'DECLARATION':
        navigate(ROUTE_PATHS.DC_DECLARATION_DETAIL.replace(':id', String(instance.entityId)))
        break
      case 'TEMPLE_PROFILE':
        navigate(ROUTE_PATHS.DC_TEMPLE_DETAIL.replace(':templeId', String(instance.templeId)))
        break
      default:
        navigate(ROUTE_PATHS.DC_TEMPLE_DETAIL.replace(':templeId', String(instance.templeId)))
    }
  }

  return (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-foreground">
        {ENTITY_TYPE_LABELS[instance.entityType] ?? instance.entityType}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">#{instance.entityId}</td>
      <td className="px-4 py-3">
        <WorkflowStatusBadge status={instance.status} subStatus={instance.subStatus} size="sm" />
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {instance.currentActorRole ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {instance.deadlineAt ? new Date(instance.deadlineAt).toLocaleDateString() : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {instance.statusUpdatedAt ? new Date(instance.statusUpdatedAt).toLocaleDateString() : '—'}
      </td>
      <td className="px-4 py-3">
        <Button size="sm" variant="outline" onClick={handleView}>
          View
        </Button>
      </td>
    </tr>
  )
}

export function DcWorkflowDashboardPage() {
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('')

  const districtId = useAppSelector((state) => state.auth.user?.districtId)

  const dashboardQuery = useGetWorkflowDashboardQuery({
    districtId,
    statuses: statusFilter ? [statusFilter] : undefined,
    entityTypes: entityTypeFilter ? [entityTypeFilter] : undefined,
    page,
    size: PAGE_SIZE,
  })

  const countQuery = useGetPendingCountQuery({ districtId })

  const instances: WorkflowInstance[] = (dashboardQuery.data as any)?.content ?? []
  const totalPages: number = (dashboardQuery.data as any)?.totalPages ?? 0
  const pendingCount: number = countQuery.data?.pendingCount ?? 0

  return (
    <div className="space-y-6 pb-10 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workflow Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All active governance workflows in your district
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
            <span className="text-lg">⏳</span>
            {pendingCount} pending action{pendingCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="CLARIFICATION_REQUESTED">Clarification Requested</option>
          <option value="CLARIFICATION_RESPONDED">Clarification Responded</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          value={entityTypeFilter}
          onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(0) }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Types</option>
          <option value="TRUST">Trust</option>
          <option value="DECLARATION">Declaration</option>
          <option value="TEMPLE_PROFILE">Temple Profile</option>
        </select>
        {(statusFilter || entityTypeFilter) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setStatusFilter(''); setEntityTypeFilter(''); setPage(0) }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        {dashboardQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : dashboardQuery.isError ? (
          <EmptyState
            title="Failed to load workflows"
            description="Unable to fetch workflow data. Please try again."
            action={{ label: 'Retry', onClick: () => dashboardQuery.refetch() }}
          />
        ) : instances.length === 0 ? (
          <EmptyState
            title="No workflows found"
            description={statusFilter || entityTypeFilter ? 'Try clearing the filters.' : 'No governance workflows in your district.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/50">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entity</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Awaiting</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deadline</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Update</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {instances.map((inst) => (
                  <WorkflowRow key={inst.id} instance={inst} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
