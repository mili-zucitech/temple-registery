import { KpiCard } from '@/components/data-display/KpiCard/KpiCard'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useGetViewerDashboardQuery } from '@/features/viewer/viewerApi'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  ShieldCheck,
  FileText,
  ClipboardList,
  Activity,
  Clock3,
  TrendingUp,
  Download,
  History,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/constants/routePaths'

export function ViewerDashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useGetViewerDashboardQuery()

  const dashboard = data?.data
  const anomalyCount = dashboard?.complianceAnomalyCount ?? 0
  const overdueCount = dashboard?.overdueDeclarationCount ?? 0
  const openObsCount = dashboard?.openObservationCount ?? 0
  const assignedObsCount = dashboard?.assignedObservationCount ?? 0
  const complianceScore = dashboard?.complianceScore ?? 0
  const workloadStatus = dashboard?.workloadStatus ?? 'Stable'
  const recentAnomalies = dashboard?.recentAnomalies ?? []

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Compliance Overview
        </h2>
        {isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load dashboard statistics. Please refresh the page.</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="Compliance Anomalies"
              value={anomalyCount}
              icon={<ShieldCheck size={20} />}
              description="Temples with active anomalies"
              onClick={() => navigate(ROUTE_PATHS.VIEWER_COMPLIANCE)}
            />
            <KpiCard
              title="Overdue Declarations"
              value={overdueCount}
              icon={<FileText size={20} />}
              description="Statewide overdue asset declarations"
              onClick={() => navigate(ROUTE_PATHS.VIEWER_DECLARATIONS)}
            />
            <KpiCard
              title="Open Observations"
              value={openObsCount}
              icon={<Eye size={20} />}
              description="Pending review or action"
              onClick={() => navigate(ROUTE_PATHS.VIEWER_COMPLIANCE)}
            />
            <KpiCard
              title="Assigned Reviews"
              value={assignedObsCount}
              icon={<ClipboardList size={20} />}
              description={`${workloadStatus} · compliance posture`}
              onClick={() => navigate(ROUTE_PATHS.VIEWER_COMPLIANCE)}
            />
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Quick Links Panel */}
        <div className="rounded-xl border border-border bg-card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Quick Access
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="flex flex-col h-20 gap-2 text-xs"
              onClick={() => navigate(ROUTE_PATHS.VIEWER_TEMPLES)}
            >
              <ShieldCheck size={20} />
              Temples
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-20 gap-2 text-xs"
              onClick={() => navigate(ROUTE_PATHS.VIEWER_DECLARATIONS)}
            >
              <FileText size={20} />
              Declarations
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-20 gap-2 text-xs"
              onClick={() => navigate(ROUTE_PATHS.VIEWER_COMPLIANCE)}
            >
              <Activity size={20} />
              Compliance
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-20 gap-2 text-xs"
              onClick={() => navigate(ROUTE_PATHS.VIEWER_AUDIT_TRAIL)}
            >
              <History size={20} />
              Audit Trail
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-20 gap-2 text-xs"
              onClick={() => navigate(ROUTE_PATHS.VIEWER_EXPORT)}
            >
              <Download size={20} />
              Export
            </Button>
          </div>
        </div>

        {/* Performance Snapshot Panel */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Performance Snapshot
          </h3>
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Compliance score</span>
                  <span className="font-semibold">{complianceScore}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${complianceScore}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="rounded-lg border border-border p-3 flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <TrendingUp size={14} /> Pending reviews
                  </span>
                  <span className="font-semibold">{assignedObsCount}</span>
                </div>
                <div className="rounded-lg border border-border p-3 flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock3 size={14} /> Overdue signals
                  </span>
                  <span className="font-semibold">{overdueCount}</span>
                </div>
                <div className="rounded-lg border border-border p-3 flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Activity size={14} /> Workload
                  </span>
                  <Badge
                    variant={
                      workloadStatus === 'High load'
                        ? 'destructive'
                        : workloadStatus === 'Medium load'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {workloadStatus}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recent Compliance Anomalies */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Compliance Anomalies
          </h2>
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => navigate(ROUTE_PATHS.VIEWER_COMPLIANCE)}
          >
            View all →
          </button>
        </div>
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          {isError ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load compliance data.</AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="p-6">
              <CardSkeleton />
            </div>
          ) : recentAnomalies.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <CheckCircle2 size={32} className="text-green-500/60" />
              No compliance anomalies detected.
            </div>
          ) : (
            <table className="min-w-[600px] w-full text-sm">
              <thead className="sticky top-0 border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Temple</th>
                  <th className="px-4 py-3 text-left font-semibold">District</th>
                  <th className="px-4 py-3 text-left font-semibold">Anomaly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentAnomalies.map((anomaly, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(ROUTE_PATHS.VIEWER_TEMPLES)}
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{anomaly.templeName}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {anomaly.districtName ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive">
                        {anomaly.anomalyType.replace(/_/g, ' ')}
                      </span>
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
