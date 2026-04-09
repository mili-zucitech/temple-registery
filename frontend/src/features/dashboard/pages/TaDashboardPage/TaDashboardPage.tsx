import { KpiCard } from '@/components/data-display/KpiCard/KpiCard'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { Button } from '@/components/ui/button'
import { useListDeclarationsQuery } from '@/features/declaration/declarationApi'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import { useNavigate } from 'react-router-dom'
import { FileText, Clock, File, Building2, Users, Wrench } from 'lucide-react'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { ROUTE_PATHS } from '@/constants/routePaths'

export function TaDashboardPage() {
  const navigate = useNavigate()
  const { data: userData, isLoading: userLoading } = useGetCurrentUserQuery()
  const user = userData?.data
  const checklist = user?.completionChecklist
  const templeId = user?.templeId

  const { data, isLoading: declLoading } = useListDeclarationsQuery(
    { templeId: templeId!, page: 0, size: DEFAULT_PAGE_SIZE },
    { skip: !templeId }
  )

  const declarations = data?.data?.content ?? []
  const isLoading = userLoading || declLoading
  const latestDeclaration = declarations[0]

  return (
    <div className="space-y-8">
      {/* Setup Checklist KPIs */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Temple Setup Progress</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              title="Temple Profile"
              value={checklist?.templeProfileStatus ?? 'Not Started'}
              icon={<Building2 size={18} />}
              description="Profile review status"
            />
            <KpiCard
              title="Trust"
              value={checklist?.trustExists ? 'Registered' : 'Not Setup'}
              icon={<FileText size={18} />}
              description="Trust registration"
            />
            <KpiCard
              title="Employees"
              value={checklist?.employeeCount ?? 0}
              icon={<Users size={18} />}
              description="Active employee records"
            />
            <KpiCard
              title="Contractors"
              value={checklist?.contractorCount ?? 0}
              icon={<Wrench size={18} />}
              description="Contractor records"
            />
          </div>
        )}
      </section>

      {/* Declaration Status */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Declaration Status</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="Latest Status"
              value={latestDeclaration?.status ?? 'None'}
              icon={<FileText size={20} />}
              description="Most recent declaration"
            />
            <KpiCard
              title="Total Declarations"
              value={data?.data?.totalElements ?? 0}
              icon={<File size={20} />}
              description="All submissions"
            />
            <KpiCard
              title="Last Submitted"
              value={latestDeclaration?.submittedAt ? new Date(latestDeclaration.submittedAt).toLocaleDateString() : '—'}
              icon={<Clock size={20} />}
              description="Last submission date"
            />
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button className="bg-gradient-gold shadow-gold" onClick={() => navigate(ROUTE_PATHS.TA_DECLARATION_NEW)}>
            Submit New Declaration
          </Button>
          <Button variant="outline" onClick={() => navigate(ROUTE_PATHS.TA_DECLARATIONS)}>
            View Declarations
          </Button>
          <Button variant="outline" onClick={() => navigate(ROUTE_PATHS.TA_TEMPLE)}>
            Update Temple Profile
          </Button>
          <Button variant="outline" onClick={() => navigate(ROUTE_PATHS.TA_EMPLOYEES)}>
            Manage Employees
          </Button>
        </div>
      </section>

      {/* Recent Declarations */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Recent Declarations</h2>
        <div className="rounded-lg border border-border bg-card">
          {isLoading ? (
            <div className="p-6"><CardSkeleton /></div>
          ) : declarations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No declarations submitted yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Declaration ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {declarations.map((dec) => (
                  <tr key={dec.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">#{dec.id}</td>
                    <td className="px-4 py-3"><StatusBadge status={dec.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {dec.submittedAt ? new Date(dec.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(ROUTE_PATHS.TA_DECLARATION_DETAIL.replace(':id', String(dec.id)))}
                      >
                        View
                      </Button>
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
