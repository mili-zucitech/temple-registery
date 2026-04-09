import { useNavigate } from 'react-router-dom'
import { Building2, FileText, AlertCircle, Clock, BarChart2 } from 'lucide-react'
import { KpiCard } from '@/components/data-display/KpiCard/KpiCard'
import { CardSkeleton, Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { useDcDashboard, useDcNotifications } from '@/features/dc/dcHooks'

export function DcModuleDashboardPage() {
  const navigate = useNavigate()
  const { dashboard, isLoading, isError, refetch } = useDcDashboard()
  const { notifications, isLoading: notifLoading } = useDcNotifications(0, 6)

  if (isError) {
    return (
      <EmptyState
        title="Failed to load dashboard"
        description="Unable to retrieve dashboard data. Please try again."
        action={{ label: 'Retry', onClick: refetch }}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">DC Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">District Collector overview</p>
        </div>
        <Button variant="outline" onClick={() => navigate(ROUTE_PATHS.DC_TEMPLES)}>
          View Temples
        </Button>
      </div>

      {/* KPI Grid */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Overview
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <KpiCard
              title="Total Temples"
              value={dashboard?.totalTemples ?? 0}
              icon={<Building2 size={20} />}
              description="Registered in your district"
            />
            <KpiCard
              title="Pending Review"
              value={dashboard?.pendingDeclarations ?? 0}
              icon={<FileText size={20} />}
              description="Declarations awaiting action"
            />
            <KpiCard
              title="Overdue"
              value={dashboard?.overdueDeclarations ?? 0}
              icon={<AlertCircle size={20} />}
              description="Past due date, still active"
            />
            <KpiCard
              title="Profile Reviews"
              value={dashboard?.pendingProfileReviews ?? 0}
              icon={<Clock size={20} />}
              description="Profile staging submissions"
            />
            <KpiCard
              title="No Declaration"
              value={dashboard?.templesWithoutApprovedDeclaration ?? 0}
              icon={<BarChart2 size={20} />}
              description="Temples without approved declaration"
            />
          </div>
        )}
      </section>

      {/* Grade Distribution */}
      {!isLoading && dashboard?.gradeDistribution && dashboard.gradeDistribution.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Temple Grade Distribution
          </h2>
          <div className="flex gap-4 flex-wrap">
            {dashboard.gradeDistribution.map((item) => (
              <div
                key={item.grade}
                className="rounded-lg border border-border bg-card px-6 py-4 flex flex-col items-center gap-1"
              >
                <span className="text-2xl font-bold text-foreground">{item.count}</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Grade {item.grade}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Notifications */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Notifications
          </h2>
        </div>
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {notifLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`px-4 py-3 flex items-start gap-3 ${!n.read ? 'bg-primary/5' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-primary mt-1" />
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
