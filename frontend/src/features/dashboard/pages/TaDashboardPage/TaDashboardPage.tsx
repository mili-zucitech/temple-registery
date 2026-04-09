import { KpiCard } from '@/components/data-display/KpiCard/KpiCard'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { Button } from '@/components/ui/button'
import { useListAllDeclarationsQuery } from '@/features/declaration/declarationApi'
import { useNavigate } from 'react-router-dom'
import { FileText, Clock, File } from 'lucide-react'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

export function TaDashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useListAllDeclarationsQuery({
    page: 0,
    size: DEFAULT_PAGE_SIZE,
  })

  const declarations = data?.data?.content ?? []
  const latestDeclaration = declarations[0]
  const totalDocs = data?.data?.totalElements ?? 0

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Your Temple</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="Declaration Status"
              value={latestDeclaration?.status ?? 'None'}
              icon={<FileText size={20} />}
              description="Most recent declaration"
            />
            <KpiCard
              title="Total Declarations"
              value={totalDocs}
              icon={<File size={20} />}
              description="All submissions"
            />
            <KpiCard
              title="Last Updated"
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
          <Button
            className="bg-gradient-gold shadow-gold"
            onClick={() => navigate('/ta/declarations/new')}
          >
            Submit New Declaration
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/ta/declarations')}
          >
            View All Declarations
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
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/ta/declarations/${dec.id}`)}>
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
