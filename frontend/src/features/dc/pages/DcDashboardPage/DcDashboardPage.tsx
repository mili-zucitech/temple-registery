import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import {
  Building2,
  FileText,
  AlertCircle,
  Clock,
  BarChart2,
  Download,
  RotateCcw,
  Users,
  AlertTriangle,
  Shield,
  Bell,
  LayoutDashboard,
} from 'lucide-react'
import { KpiCard } from '@/components/data-display/KpiCard/KpiCard'
import { CardSkeleton, Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { useDcDashboard, useDcNotifications } from '@/features/dc/dcHooks'
import { useAppSelector } from '@/app/store'
import { useGeoHierarchy } from '@/features/geo/geoHooks'
import type { AreaDistributionItem } from '@/features/dc/dcTypes'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts'

export function DcModuleDashboardPage() {
  const navigate = useNavigate()
  const { dashboard, isLoading, isError, refetch } = useDcDashboard()
  const { notifications, isLoading: notifLoading, onMarkRead } = useDcNotifications(0, 6)
  const districtId = useAppSelector((s) => s.auth.currentUser?.districtId ?? null)
  const { taluks, districts } = useGeoHierarchy({ stateId: 1, districtId: districtId ?? undefined })

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <EmptyState
          title="Failed to load dashboard"
          description="Unable to retrieve dashboard data. Please check your connection and try again."
          action={{ label: 'Retry Now', onClick: refetch }}
        />
      </div>
    )
  }

  const overdueCount = dashboard?.overdueDeclarations ?? 0
  const totalTemples = dashboard?.totalTemples ?? 0
  const noDecl = dashboard?.templesWithoutApprovedDeclaration ?? 0
  const compliancePct = totalTemples > 0 ? Math.round(((totalTemples - noDecl) / totalTemples) * 100) : 0
  const complianceColor =
    compliancePct >= 80 ? 'text-emerald-600' : compliancePct >= 50 ? 'text-amber-600' : 'text-destructive'

  const gradeData = (dashboard?.gradeDistribution ?? []).map((g) => ({
    name: `Grade ${g.grade}`,
    grade: g.grade,
    value: g.count,
  }))
  const GRADE_COLORS: Record<string, string> = {
    A: '#10b981',
    B: '#f59e0b',
    C: '#3b82f6',
    D: '#8b5cf6',
    UNGRADED: '#64748b',
  }

  const areaData: AreaDistributionItem[] =
    districtId != null
      ? (dashboard?.talukDistribution ?? [])
      : (dashboard?.districtDistribution ?? [])
  const areaIdToName = useMemo(() => {
    const map: Record<number, string> = {}
    if (districtId != null) {
      for (const t of taluks.data) map[t.id] = t.name
    } else {
      for (const d of districts.data) map[d.id] = d.name
    }
    return map
  }, [districtId, taluks.data, districts.data])
  const areaChart = areaData.map((x) => ({
    id: x.areaId,
    name: areaIdToName[x.areaId] ?? String(x.areaId),
    count: x.count,
  }))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── HERO SECTION ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-dark p-6 text-white shadow-soft-lg">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-xl font-bold tracking-title mb-2">
              DC Dashboard
            </h1>
            <p className="text-primary-foreground/70 font-regular max-w-xl text-base">
              Welcome back to the Temple Registry & Management Portal. Here's an overview of your district's compliance and activity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="bg-white/5 border-white/10 hover:bg-white/10 text-white gap-2 transition-all text-xs font-medium tracking-button h-9"
              onClick={refetch}
              disabled={isLoading}
            >
              <RotateCcw size={16} className={cn(isLoading && "animate-spin")} />
              Refresh Data
            </Button>
            <Button 
              className="bg-gradient-gold shadow-gold border-none hover:scale-105 transition-all text-xs font-medium tracking-button h-9"
              onClick={() => navigate(ROUTE_PATHS.DC_EXPORT)}
            >
              <Download size={16} className="mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </section>

      {/* ── URGENT ALERTS ────────────────────────────────────────────────── */}
      {!isLoading && overdueCount > 0 && (
        <div
          role="alert"
          className="group relative overflow-hidden flex flex-col md:flex-row items-center gap-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 shadow-sm transition-all hover:shadow-md animate-in zoom-in-95 duration-500"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-destructive" aria-hidden />
          <div className="flex bg-destructive/10 p-3 rounded-xl text-destructive shrink-0 group-hover:scale-110 transition-transform">
            <AlertCircle size={24} aria-hidden />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-md font-semibold text-foreground tracking-section">Immediate Action Required</h3>
            <p className="text-sm font-regular text-muted-foreground mt-0.5">
              <span className="text-destructive font-semibold text-lg mr-1">{overdueCount}</span>
              temple{overdueCount !== 1 ? 's have' : ' has'} overdue declarations that need your attention.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="w-full md:w-auto px-8 shadow-lg shadow-destructive/20 hover:shadow-destructive/40 hover:scale-105 transition-all text-xs font-medium tracking-button h-10"
            onClick={() => navigate(`${ROUTE_PATHS.DC_TEMPLES}?declarationStatus=OVERDUE`)}
          >
            Review All Overdue
          </Button>
        </div>
      )}

      {/* ── KPI GRID ───────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 tracking-section">
            <BarChart2 size={20} className="text-primary" />
            Key Performance Indicators
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <>
              <KpiCard
                title="Total Temples"
                value={dashboard?.totalTemples ?? 0}
                icon={<Building2 size={22} />}
                description="Registered in your district"
                className="cursor-pointer"
                onClick={() => navigate(ROUTE_PATHS.DC_TEMPLES)}
              />
              <KpiCard
                title="Pending Review"
                value={dashboard?.pendingDeclarations ?? 0}
                icon={<FileText size={22} />}
                description="Awaiting DC approval"
                className="cursor-pointer border-amber-500/20"
                onClick={() => navigate(`${ROUTE_PATHS.DC_TEMPLES}?declarationStatus=PENDING_REVIEW`)}
              />
              <KpiCard
                title="Overdue"
                value={dashboard?.overdueDeclarations ?? 0}
                icon={<Clock size={22} />}
                description="Compliance deadline passed"
                className="cursor-pointer border-destructive/20"
                onClick={() => navigate(`${ROUTE_PATHS.DC_TEMPLES}?declarationStatus=OVERDUE`)}
              />
              <KpiCard
                title="Profile Reviews"
                value={dashboard?.pendingProfileReviews ?? 0}
                icon={<Users size={22} />}
                description="Updates pending verification"
                className="cursor-pointer border-blue-500/20"
                onClick={() => navigate(`${ROUTE_PATHS.DC_TEMPLES}?profileStatus=PENDING_REVIEW`)}
              />
              <KpiCard
                title="No Declaration"
                value={dashboard?.templesWithoutApprovedDeclaration ?? 0}
                icon={<AlertTriangle size={22} />}
                description="Missing mandatory filings"
                className="cursor-pointer border-orange-500/20 relative overflow-hidden"
                onClick={() => navigate(`${ROUTE_PATHS.DC_TEMPLES}?hasApprovedDeclaration=false`)}
              />
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── VISUAL ANALYTICS (GRADE + AREA) ───────────────────────────── */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 tracking-section">
              <Shield size={20} className="text-primary" />
              Visual Analytics
            </h2>
          </div>
          
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-6 shadow-soft-md">
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">Grade distribution</p>
                    <p className="text-xs text-muted-foreground">Click legend to filter</p>
                  </div>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={gradeData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {gradeData.map((entry) => (
                            <Cell key={entry.grade} fill={GRADE_COLORS[entry.grade] ?? '#64748b'} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {gradeData.map((g) => (
                      <button
                        key={g.grade}
                        className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted/40 transition-colors"
                        onClick={() => navigate(`${ROUTE_PATHS.DC_TEMPLES}?grade=${g.grade}`)}
                        title={`Filter Grade ${g.grade}`}
                      >
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: GRADE_COLORS[g.grade] ?? '#64748b' }} />
                        <span className="text-muted-foreground">{g.name}</span>
                        <span className="ml-auto font-semibold text-foreground tabular-nums">{g.value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">
                      {districtId != null ? 'Temples per Taluk' : 'Temples per District'}
                    </p>
                    <p className="text-xs text-muted-foreground">Top {Math.min(areaChart.length, 12)}</p>
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={areaChart} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} height={50} angle={-20} textAnchor="end" />
                        <YAxis tick={{ fontSize: 10 }} />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── COMPLIANCE HEALTH + ACTIVITY FEED ──────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 tracking-section">
              <Bell size={20} className="text-primary" />
              Health & Activity
            </h2>
            <Button variant="link" size="sm" className="text-xs font-medium text-primary hover:no-underline tracking-button">
              View All
            </Button>
          </div>
          
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm shadow-soft-md overflow-hidden min-h-[320px]">
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Compliance health</p>
                  <p className="text-sm font-semibold text-foreground">Approved declarations coverage</p>
                </div>
                <div className={cn("text-sm font-bold tabular-nums", complianceColor)}>{compliancePct}%</div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full", compliancePct >= 80 ? "bg-emerald-500" : compliancePct >= 50 ? "bg-amber-500" : "bg-destructive")}
                  style={{ width: `${Math.min(Math.max(compliancePct, 0), 100)}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Approved: {(totalTemples - noDecl).toLocaleString()}</span>
                <span>Missing: {noDecl.toLocaleString()}</span>
              </div>
              {noDecl > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="mt-4 w-full h-9 text-xs font-medium tracking-button relative"
                  onClick={() => navigate(`${ROUTE_PATHS.DC_TEMPLES}?hasApprovedDeclaration=false`)}
                  title="These temples have not submitted mandatory declarations"
                >
                  <span className="absolute left-3 inline-flex h-2.5 w-2.5 rounded-full bg-white/90 animate-pulse" />
                  Review Now (No Declaration)
                </Button>
              )}
            </div>

            <div className="divide-y divide-border/50">
            {notifLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center opacity-50">
                <Bell size={40} className="mb-4 text-muted-foreground" />
                <p className="text-sm font-semibold">No new notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={cn(
                    "p-4 hover:bg-muted/30 transition-colors cursor-pointer relative",
                    !notif.read && "bg-primary/5"
                  )}
                  onClick={() => onMarkRead(notif.id)}
                >
                  {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                  <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-1">{notif.title}</h4>
                  <p className="text-xs font-regular text-muted-foreground mt-1 line-clamp-2">{notif.body}</p>
                  <p className="text-xs font-regular text-muted-foreground/60 mt-2">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
            </div>
          </div>
        </section>
      </div>

      {/* ── QUICK NAVIGATION ────────────────────────────────────────────── */}
      <section className="pb-10">
        <h2 className="text-lg font-display font-semibold text-foreground mb-6 flex items-center gap-2">
          <LayoutDashboard size={20} className="text-primary" />
          Quick Navigation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <NavTile 
            title="Temple Directory"
            description="Search and browse all temples within your district"
            icon={<Building2 size={24} />}
            onClick={() => navigate(ROUTE_PATHS.DC_TEMPLES)}
            color="bg-primary/10 text-primary"
          />
          <NavTile 
            title="Declaration Queue"
            description="Review and approve pending asset declarations"
            icon={<FileText size={24} />}
            onClick={() => navigate(`${ROUTE_PATHS.DC_DECLARATIONS}?status=PENDING_REVIEW`)}
            color="bg-amber-500/10 text-amber-600"
          />
          <NavTile 
            title="Compliance Reports"
            description="Generate and export district-wide compliance data"
            icon={<Download size={24} />}
            onClick={() => navigate(ROUTE_PATHS.DC_EXPORT)}
            color="bg-emerald-500/10 text-emerald-600"
          />
        </div>
      </section>
    </div>
  )
}

function NavTile({ title, description, icon, onClick, color }: any) {
  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-4 p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm hover:border-primary/50 hover:shadow-soft-lg transition-all duration-300 text-left"
    >
      <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", color)}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </button>
  )
}
