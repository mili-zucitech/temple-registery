import { KpiCard } from '@/components/data-display/KpiCard/KpiCard'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useGetComplianceReportQuery, useListObservationsQuery } from '@/features/auditor/auditorApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Eye, ShieldCheck, FileText, Activity, Clock3, TrendingUp, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/constants/routePaths'

export function AuditorDashboardPage() {
  const navigate = useNavigate()
  const { data: complianceData, isLoading: complianceLoading, isError: complianceError } = useGetComplianceReportQuery()
  const { data: openObsData, isLoading: openObsLoading, isError: openObsError } = useListObservationsQuery({ status: 'OPEN', page: 0, size: 1 })
  const { data: assignedObsData, isLoading: assignedObsLoading, isError: assignedObsError } = useListObservationsQuery({ status: 'ASSIGNED', page: 0, size: 1 })
  const { data: recentObsData, isLoading: recentObsLoading, isError: recentObsError } = useListObservationsQuery({ page: 0, size: 6 })

  const anomalies = complianceData?.data ?? []
  const complianceCount = anomalies.length
  const openObsCount = openObsData?.data?.totalElements ?? 0
  const assignedObsCount = assignedObsData?.data?.totalElements ?? 0
  const overdueDeclarations = anomalies.filter((a) => a.anomalyType === 'OVERDUE_DECLARATION').length
  const criticalAnomalies = anomalies.filter((a) => a.anomalyType === 'NO_APPROVED_DECLARATION').length
  const recentObs = recentObsData?.data?.content ?? []

  const kpiLoading = complianceLoading || openObsLoading || assignedObsLoading
  const kpiError = complianceError || openObsError || assignedObsError

  const workloadStatus = openObsCount > 20 ? 'High load' : openObsCount > 8 ? 'Medium load' : 'Stable'
  const scoreBase = Math.max(0, 100 - complianceCount * 3 - overdueDeclarations * 4)
  const complianceScore = Math.max(0, Math.min(100, scoreBase))

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Compliance Overview</h2>
        {kpiError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load dashboard statistics. Please refresh the page.</AlertDescription>
          </Alert>
        ) : kpiLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="Open Observations"
              value={openObsCount}
              icon={<Eye size={20} />}
              description="Pending review or action"
              onClick={() => navigate(ROUTE_PATHS.AUDITOR_OBSERVATIONS)}
            />
            <KpiCard
              title="Compliance Anomalies"
              value={complianceCount}
              icon={<ShieldCheck size={20} />}
              description="Temples with active anomalies"
              onClick={() => navigate(ROUTE_PATHS.AUDITOR_COMPLIANCE)}
            />
            <KpiCard
              title="Overdue Declarations"
              value={overdueDeclarations}
              icon={<FileText size={20} />}
              description="Statewide overdue asset declarations"
              onClick={() => navigate(ROUTE_PATHS.AUDITOR_DECLARATIONS)}
            />
            <KpiCard
              title="Assigned Reviews"
              value={assignedObsCount}
              icon={<ClipboardList size={20} />}
              description={`${workloadStatus} \u00b7 ${criticalAnomalies} critical risk signals`}
              onClick={() => navigate(ROUTE_PATHS.AUDITOR_OBSERVATIONS)}
            />
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Action Queue</h3>
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTE_PATHS.AUDITOR_OBSERVATIONS)}>
              Open Worklist
            </Button>
          </div>
          {recentObsLoading ? (
            <CardSkeleton />
          ) : recentObsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load recent observations.</AlertDescription>
            </Alert>
          ) : recentObs.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 rounded-lg bg-muted/30">
              No items in queue. You are fully up to date.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="sticky top-0 bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Title</th>
                    <th className="px-3 py-2 text-left font-semibold">Temple</th>
                    <th className="px-3 py-2 text-left font-semibold">Severity</th>
                    <th className="px-3 py-2 text-left font-semibold">Status</th>
                    <th className="px-3 py-2 text-left font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentObs.map((obs) => (
                    <tr
                      key={obs.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(ROUTE_PATHS.AUDITOR_OBSERVATION_DETAIL.replace(':id', String(obs.id)))}
                    >
                      <td className="px-3 py-2 font-medium">{obs.title}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{obs.templeName ?? `#${obs.templeId}`}</td>
                      <td className="px-3 py-2">
                        <Badge variant={obs.severity === 'CRITICAL' ? 'destructive' : obs.severity === 'HIGH' ? 'default' : 'secondary'}>
                          {obs.severity}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={obs.status === 'OPEN' ? 'destructive' : obs.status === 'ASSIGNED' ? 'default' : 'secondary'}>
                          {obs.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(obs.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Performance Snapshot</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Compliance score</span>
              <span className="font-semibold">{complianceScore}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${complianceScore}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="rounded-lg border border-border p-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2"><TrendingUp size={14} /> Pending reviews</span>
              <span className="font-semibold">{assignedObsCount}</span>
            </div>
            <div className="rounded-lg border border-border p-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2"><Clock3 size={14} /> Overdue signals</span>
              <span className="font-semibold">{overdueDeclarations}</span>
            </div>
            <div className="rounded-lg border border-border p-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2"><Activity size={14} /> Workload</span>
              <Badge variant={workloadStatus === 'High load' ? 'destructive' : workloadStatus === 'Medium load' ? 'secondary' : 'outline'}>
                {workloadStatus}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Compliance Anomalies */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Compliance Anomalies</h2>
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => navigate(ROUTE_PATHS.AUDITOR_COMPLIANCE)}
          >
            View all →
          </button>
        </div>
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          {complianceError ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load compliance data.</AlertDescription>
            </Alert>
          ) : complianceLoading ? (
            <div className="p-6"><CardSkeleton /></div>
          ) : complianceCount === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <Activity size={32} className="text-muted-foreground/40" />
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
                {(complianceData?.data ?? []).slice(0, 8).map((anomaly, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{anomaly.templeName}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{anomaly.districtName ?? '—'}</td>
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
