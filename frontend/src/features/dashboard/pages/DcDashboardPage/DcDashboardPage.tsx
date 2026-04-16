import { KpiCard } from '@/components/data-display/KpiCard/KpiCard'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { useListAllDeclarationsQuery } from '@/features/declaration/declarationApi'
import { Building2, FileText, AlertCircle, Users } from 'lucide-react'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

export function DcDashboardPage() {
  const { data, isLoading } = useListAllDeclarationsQuery({
    page: 0,
    size: DEFAULT_PAGE_SIZE,
  })

  const declarations = data?.data?.content ?? []
  const totalDeclarations = data?.data?.totalElements ?? 0
  const pendingCount = declarations.filter((d) => d.status === 'SUBMITTED').length
  const overdueCount = declarations.filter((d) => d.status === 'DRAFT').length

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Overview</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Declarations"
              value={totalDeclarations}
              icon={<FileText size={20} />}
              description="All declarations in your district"
            />
            <KpiCard
              title="Pending Review"
              value={pendingCount}
              icon={<AlertCircle size={20} />}
              description="Submitted, awaiting your action"
            />
            <KpiCard
              title="Overdue / Draft"
              value={overdueCount}
              icon={<Building2 size={20} />}
              description="Not yet submitted"
            />
            <KpiCard
              title="District Coverage"
              value={`${totalDeclarations > 0 ? Math.round((pendingCount / totalDeclarations) * 100) : 0}%`}
              icon={<Users size={20} />}
              description="Review completion rate"
            />
          </div>
        )}
      </section>

      {/* Recent Declarations */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Recent Declarations</h2>
        <div className="rounded-lg border border-border bg-card">
          {isLoading ? (
            <div className="p-6"><CardSkeleton /></div>
          ) : declarations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No declarations found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Temple</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {declarations.slice(0, 8).map((dec) => (
                  <tr key={dec.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">{dec.templeName ?? `Temple #${dec.templeId}`}</td>
                    <td className="px-4 py-3"><StatusBadge status={dec.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{dec.submittedAt ? new Date(dec.submittedAt).toLocaleDateString() : '—'}</td>
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
