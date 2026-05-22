import { KpiCard } from '@/components/data-display/KpiCard/KpiCard'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { useGetStatewideDashboardQuery, useListAuditEventsQuery, type AuditEventResponse } from '@/features/admin/adminApi'
import { PolicyGate } from '@/features/access-control/components/PolicyGate'
import { TARGET_KEYS } from '@/features/access-control/constants/targetKeys'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { Users, Building2, FileText, ShieldAlert, AlertCircle, Activity, BellRing, Wrench, UserCog } from 'lucide-react'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { data: dashData, isLoading: dashLoading, isError: dashError } = useGetStatewideDashboardQuery()
  const { data: auditData, isLoading: auditLoading, isError: auditError } = useListAuditEventsQuery({ page: 0, size: 5 })

  const stats = dashData?.data
  const auditEvents = auditData?.data?.content ?? []
  const districtDistribution = stats?.districtDistribution ?? []
  const gradeDistribution = stats?.gradeDistribution ?? []
  const totalByDistrict = districtDistribution.reduce((acc, item) => acc + item.count, 0)
  const totalByGrade = gradeDistribution.reduce((acc, item) => acc + item.count, 0)
  const profileReviewLoad = stats?.totalPendingProfileReviews ?? 0
  const approvalQueue = (stats?.totalPendingDeclarations ?? 0) + profileReviewLoad
  const riskLevel = (stats?.totalOverdueDeclarations ?? 0) > 10 ? 'High' : (stats?.totalOverdueDeclarations ?? 0) > 0 ? 'Medium' : 'Low'

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">System Overview</h2>
        {dashError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load system statistics. Please refresh the page.</AlertDescription>
          </Alert>
        ) : dashLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <PolicyGate target={TARGET_KEYS.KPI_ADMIN_TOTAL_USERS}>
              <KpiCard
                title="Total Users"
                value={stats?.totalUsers ?? 0}
                icon={<Users size={20} />}
                description={`${stats?.totalAuditors ?? 0} auditors · ${stats?.totalDistrictCollectors ?? 0} DCs`}
              />
            </PolicyGate>
            <PolicyGate target={TARGET_KEYS.KPI_ADMIN_TEMPLES_REGISTERED}>
              <KpiCard
                title="Temples Registered"
                value={stats?.totalTemples ?? 0}
                icon={<Building2 size={20} />}
                description={`${stats?.totalActiveTemples ?? 0} active · ${stats?.totalSuspendedTemples ?? 0} suspended`}
              />
            </PolicyGate>
            <PolicyGate target={TARGET_KEYS.KPI_ADMIN_PENDING_DECLARATIONS}>
              <KpiCard
                title="Pending Declarations"
                value={stats?.totalPendingDeclarations ?? 0}
                icon={<FileText size={20} />}
                description={`${stats?.totalOverdueDeclarations ?? 0} overdue`}
              />
            </PolicyGate>
            <PolicyGate target={TARGET_KEYS.KPI_ADMIN_AUDIT_EVENTS}>
              <KpiCard
                title="Audit Events (24h)"
                value={stats?.recentAuditEventCount ?? 0}
                icon={<ShieldAlert size={20} />}
                description="Data mutation events"
              />
            </PolicyGate>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Operational Health</h3>
            <Badge variant={riskLevel === 'High' ? 'destructive' : riskLevel === 'Medium' ? 'secondary' : 'outline'}>
              Risk: {riskLevel}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Approval Queue</p>
              <p className="text-2xl font-semibold">{approvalQueue}</p>
              <p className="text-xs text-muted-foreground mt-1">Declarations + profile reviews pending</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Active Users</p>
              <p className="text-2xl font-semibold">{(stats?.totalUsers ?? 0) - (stats?.totalSuperAdmins ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Operational users across districts and temples</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Audit Pressure</p>
              <p className="text-2xl font-semibold">{stats?.recentAuditEventCount ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Mutation events in the last 24 hours</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick Actions</h3>
          <Button className="w-full justify-start gap-2" variant="outline" onClick={() => navigate(ROUTE_PATHS.ADMIN_USERS)}>
            <UserCog size={16} /> Manage Users
          </Button>
          <Button className="w-full justify-start gap-2" variant="outline" onClick={() => navigate(ROUTE_PATHS.ADMIN_AUDIT)}>
            <Activity size={16} /> Review Audit Logs
          </Button>
          <Button className="w-full justify-start gap-2" variant="outline" onClick={() => navigate(ROUTE_PATHS.ADMIN_NOTIFICATION_RULES)}>
            <BellRing size={16} /> Notification Rules
          </Button>
          <Button className="w-full justify-start gap-2" variant="outline" onClick={() => navigate(ROUTE_PATHS.ADMIN_TOOLS)}>
            <Wrench size={16} /> Admin Tools
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">District Load Distribution</h3>
          {districtDistribution.length === 0 ? (
            <div className="text-sm text-muted-foreground">No district distribution data available.</div>
          ) : (
            <div className="space-y-3">
              {districtDistribution.slice(0, 8).map((item) => {
                const width = totalByDistrict > 0 ? (item.count / totalByDistrict) * 100 : 0
                return (
                  <div key={item.districtId}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{item.districtName ?? `District #${item.districtId}`}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.max(width, 6)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Temple Grade Mix</h3>
          {gradeDistribution.length === 0 ? (
            <div className="text-sm text-muted-foreground">No grade distribution data available.</div>
          ) : (
            <div className="space-y-3">
              {gradeDistribution.map((item) => {
                const width = totalByGrade > 0 ? (item.count / totalByGrade) * 100 : 0
                return (
                  <div key={item.grade}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Grade {item.grade}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${Math.max(width, 8)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Recent Audit Events */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Recent Audit Events</h2>
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          {auditError ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load audit events.</AlertDescription>
            </Alert>
          ) : auditLoading ? (
            <div className="p-6"><CardSkeleton /></div>
          ) : auditEvents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No audit events found.</div>
          ) : (
            <table className="min-w-[600px] w-full text-sm">
              <thead className="sticky top-0 border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Actor</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Action</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Entity</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditEvents.map((event: AuditEventResponse) => (
                  <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{event.actorName ?? `${event.actorRole} #${event.actorId}`}</td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{event.action}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{event.entityName ?? `${event.entityType} #${event.entityId}`}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {event.occurredAt ? new Date(event.occurredAt).toLocaleString() : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
