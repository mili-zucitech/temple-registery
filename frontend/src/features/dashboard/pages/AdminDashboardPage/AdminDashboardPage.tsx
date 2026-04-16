import { KpiCard } from '@/components/data-display/KpiCard/KpiCard'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { useListUsersQuery, useListAuditEventsQuery, type AuditEventResponse } from '@/features/admin/adminApi'
import { useDcDashboard } from '@/features/dc/dcHooks'
import { Users, Building2, FileText, ShieldAlert } from 'lucide-react'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

export function AdminDashboardPage() {
  const { data: usersData, isLoading: usersLoading } = useListUsersQuery({ page: 0, size: DEFAULT_PAGE_SIZE })
  const { data: auditData, isLoading: auditLoading } = useListAuditEventsQuery({ page: 0, size: 5 })
  const { dashboard: dcStats, isLoading: dcStatsLoading } = useDcDashboard()

  const totalUsers = usersData?.data?.totalElements ?? 0
  const auditEvents = auditData?.data?.content ?? []
  const isLoading = usersLoading || auditLoading || dcStatsLoading

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">System Overview</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Users"
              value={totalUsers}
              icon={<Users size={20} />}
              description="Active user accounts"
            />
            <KpiCard
              title="Temples Registered"
              value={dcStats?.totalTemples ?? 0}
              icon={<Building2 size={20} />}
              description="Across all districts"
            />
            <KpiCard
              title="Pending Declarations"
              value={dcStats?.pendingDeclarations ?? 0}
              icon={<FileText size={20} />}
              description="Awaiting review"
            />
            <KpiCard
              title="Recent Audit Events"
              value={auditEvents.length}
              icon={<ShieldAlert size={20} />}
              description="Last 5 security events"
            />
          </div>
        )}
      </section>

      {/* Recent Audit Events */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Recent Audit Events</h2>
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          {auditLoading ? (
            <div className="p-6"><CardSkeleton /></div>
          ) : auditEvents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No audit events found.</div>
          ) : (
            <table className="min-w-[600px] w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
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
                    <td className="px-4 py-3 whitespace-nowrap">{event.actorUsername}</td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{event.action}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{event.entityType} #{event.entityId}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {event.createdAt ? new Date(event.createdAt).toLocaleString() : ''}
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
