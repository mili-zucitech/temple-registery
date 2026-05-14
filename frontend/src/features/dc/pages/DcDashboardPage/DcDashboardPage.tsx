import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
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
  ChevronRight,
  MapPin,
  Pencil,
  BarChart3,
} from 'lucide-react'
import { CardSkeleton, Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { useDcDashboard, useDcNotifications } from '@/features/dc/dcHooks'
import { useAppSelector } from '@/app/store'
import { useGeoHierarchy } from '@/features/geo/geoHooks'
import type { AreaDistributionItem } from '@/features/dc/dcTypes'
import type { ReactNode } from 'react'
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
  CartesianGrid,
} from 'recharts'

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35 } },
}
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
}

// ─── Custom recharts tooltip ──────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; name?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-soft-md">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="text-xs text-primary mt-0.5">
        {payload[0].value} temple{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ─── Quick Action tile ────────────────────────────────────────────────────────

function QuickAction({
  label, sub, icon, to, bg, fg, iconBg, border, shine,
}: {
  label: string
  sub: string
  icon: ReactNode
  to: string
  bg: string
  fg: string
  iconBg: string
  border: string
  shine: string
}) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className={cn(
        'group relative flex flex-col gap-3 rounded-2xl p-4 text-left overflow-hidden',
        'border transition-all duration-200 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:shadow-sm',
        bg, border,
      )}
    >
      {/* Blurred shine orb */}
      <div className={cn(
        'absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-300 blur-md',
        shine,
      )} />
      {/* White shimmer sweep */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/35 via-transparent to-transparent dark:from-white/8 pointer-events-none" />
      {/* Icon + arrow row */}
      <div className="relative flex items-start justify-between">
        <span className={cn(
          'flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 shadow-sm ring-1 ring-inset ring-black/[0.06]',
          iconBg, fg,
        )}>
          {icon}
        </span>
        <span className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 mt-0.5',
          'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200',
          iconBg, fg,
        )}>
          <ChevronRight size={12} />
        </span>
      </div>
      {/* Text */}
      <div className="relative">
        <p className={cn('text-sm font-bold leading-tight', fg)}>{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{sub}</p>
      </div>
    </button>
  )
}

// ─── Page skeleton ────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-32 rounded-xl bg-primary/15" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-40 rounded-2xl bg-muted" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-96 rounded-2xl bg-muted" />
        <div className="h-96 rounded-2xl bg-muted" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DcModuleDashboardPage() {
  const navigate = useNavigate()
  const { dashboard, isLoading, isError, refetch } = useDcDashboard()
  const { notifications, isLoading: notifLoading, onMarkRead } = useDcNotifications(0, 6)
  const districtId = useAppSelector((s) => s.auth.currentUser?.districtId ?? null)
  const { taluks, districts } = useGeoHierarchy({ stateId: 1, districtId: districtId ?? undefined })

  // Compute all data before any conditional returns (Rules of Hooks)
  const overdueCount = dashboard?.overdueDeclarations ?? 0
  const totalTemples = dashboard?.totalTemples ?? 0
  const noDecl = dashboard?.templesWithoutApprovedDeclaration ?? 0
  const pendingReviews = dashboard?.pendingDeclarations ?? 0
  const profileReviews = dashboard?.pendingProfileReviews ?? 0
  const compliancePct = totalTemples > 0 ? Math.round(((totalTemples - noDecl) / totalTemples) * 100) : 0

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
  const areaChart = areaData.slice(0, 12).map((x) => ({
    id: x.areaId,
    name: areaIdToName[x.areaId] ?? String(x.areaId),
    count: x.count,
  }))

  // Conditional returns after all hooks
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

  if (isLoading) return <DashboardSkeleton />

  return (
    <motion.div className="space-y-5" initial="hidden" animate="show" variants={stagger}>
      {/* ── HERO SECTION ────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="relative overflow-hidden rounded-xl bg-gradient-gold px-5 py-3.5 shadow-gold">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 pointer-events-none" />
          <div className="absolute right-20 -bottom-10 h-28 w-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4">
            {/* Left: identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm">
                <Shield size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h1 className="font-display text-base sm:text-lg font-bold text-white leading-tight">
                    District Collector Dashboard
                  </h1>
                  <span className="inline-flex items-center rounded-full bg-white/15 border border-white/25 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                    District {districtId ?? 'All'}
                  </span>
                </div>
                <p className="text-[11px] text-white/70 mt-0.5 truncate">
                  Temple Registry & Management Portal
                  {totalTemples > 0 && (
                    <span className="inline-flex items-center gap-0.5 ml-2">
                      <MapPin size={10} className="inline" />{totalTemples} temples under jurisdiction
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Right: compliance + actions */}
            <div className="flex-shrink-0 py-3 flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-28 rounded-full bg-white/25 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-700"
                      style={{ width: `${Math.min(Math.max(compliancePct, 0), 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-extrabold text-white tabular-nums">{compliancePct}%</span>
                </div>
                <p className="text-[10px] text-white/70">Compliance coverage</p>
              </div>
              <button
                onClick={refetch}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-lg bg-white/25 border border-white/30 hover:bg-white/40 transition-colors px-3 py-1.5 text-xs font-semibold text-white"
              >
                <RotateCcw size={12} className={cn(isLoading && "animate-spin")} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── URGENT ALERTS ────────────────────────────────────────────────── */}
      {overdueCount > 0 && (
        <motion.div variants={fadeUp}>
          <div
            role="alert"
            className="group relative overflow-hidden flex flex-col md:flex-row items-center gap-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 shadow-sm transition-all hover:shadow-md"
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
        </motion.div>
      )}

      {/* ── KPI STRIP ────────────────────────────────────────────────────── */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5" variants={stagger}>
        {([
          {
            label: 'Total Temples',
            value: totalTemples,
            icon: <Building2 size={20} />,
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
            accentBar: 'bg-primary',
            sub: 'Registered in district',
            onClick: () => navigate(ROUTE_PATHS.DC_TEMPLES),
          },
          {
            label: 'Pending Review',
            value: pendingReviews,
            icon: <FileText size={20} />,
            iconBg: 'bg-amber-500/10',
            iconColor: 'text-amber-600',
            accentBar: 'bg-amber-500',
            sub: 'Awaiting DC approval',
            onClick: () => navigate(`${ROUTE_PATHS.DC_TEMPLES}?declarationStatus=PENDING_REVIEW`),
          },
          {
            label: 'Overdue',
            value: overdueCount,
            icon: <Clock size={20} />,
            iconBg: 'bg-destructive/10',
            iconColor: 'text-destructive',
            accentBar: 'bg-destructive',
            sub: 'Deadline passed',
            onClick: () => navigate(`${ROUTE_PATHS.DC_TEMPLES}?declarationStatus=OVERDUE`),
          },
          {
            label: 'Profile Reviews',
            value: profileReviews,
            icon: <Users size={20} />,
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-600',
            accentBar: 'bg-blue-500',
            sub: 'Updates pending',
            onClick: () => navigate(`${ROUTE_PATHS.DC_TEMPLES}?profileStatus=PENDING_REVIEW`),
          },
          {
            label: 'No Declaration',
            value: noDecl,
            icon: <AlertTriangle size={20} />,
            iconBg: 'bg-orange-500/10',
            iconColor: 'text-orange-600',
            accentBar: 'bg-orange-500',
            sub: 'Missing filings',
            onClick: () => navigate(`${ROUTE_PATHS.DC_TEMPLES}?hasApprovedDeclaration=false`),
          },
        ] as const).map(card => (
          <motion.button
            key={card.label}
            variants={fadeUp}
            onClick={card.onClick}
            className="relative rounded-xl border border-border bg-card px-4 pt-4 pb-3.5 shadow-soft-sm hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 overflow-hidden text-left"
          >
            <div className={cn('absolute top-0 left-0 right-0 h-[3px]', card.accentBar)} />
            <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', card.iconBg)}>
              <span className={card.iconColor}>{card.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">{card.label}</p>
              <p className="mt-0.5 text-xl font-bold text-foreground leading-none">{card.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{card.sub}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* ── QUICK ACTIONS ────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card px-5 pt-4 pb-5 shadow-soft-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground">Quick Actions</h2>
          <span className="text-[11px] text-muted-foreground">3 actions available</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <QuickAction 
            label="Temple Directory"   
            sub="Search & browse"   
            icon={<Building2 size={17} />}        
            to={ROUTE_PATHS.DC_TEMPLES}          
            bg="bg-primary/5 dark:bg-primary/10"  
            fg="text-primary"  
            iconBg="bg-primary/10 dark:bg-primary/20"  
            border="border-primary/20"  
            shine="bg-primary/20" 
          />
          <QuickAction 
            label="Declaration Queue"    
            sub="Review pending"    
            icon={<FileText size={17} />} 
            to={`${ROUTE_PATHS.DC_DECLARATIONS}?status=PENDING_REVIEW`} 
            bg="bg-amber-50 dark:bg-amber-950/30" 
            fg="text-amber-600 dark:text-amber-400" 
            iconBg="bg-amber-100 dark:bg-amber-900/50" 
            border="border-amber-200 dark:border-amber-800" 
            shine="bg-amber-200" 
          />
          <QuickAction 
            label="Export Reports"  
            sub="Generate data"     
            icon={<Download size={17} />}      
            to={ROUTE_PATHS.DC_EXPORT}  
            bg="bg-emerald-50 dark:bg-emerald-950/30"      
            fg="text-emerald-600 dark:text-emerald-400"      
            iconBg="bg-emerald-100 dark:bg-emerald-900/50"      
            border="border-emerald-200 dark:border-emerald-800"      
            shine="bg-emerald-200" 
          />
        </div>
      </motion.div>
      {/* ── VISUAL ANALYTICS + HEALTH ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visual Analytics (Grade + Area) */}
        <motion.div variants={fadeUp} className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-soft-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Visual Analytics</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Grade distribution & area breakdown</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <BarChart3 size={12} /> {totalTemples} Total
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grade Distribution Pie */}
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">Grade distribution</p>
                <p className="text-xs text-muted-foreground">Click to filter</p>
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
                    <RechartsTooltip content={<ChartTooltip />} />
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

            {/* Area Distribution Bar */}
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">
                  {districtId != null ? 'Temples per Taluk' : 'Temples per District'}
                </p>
                <p className="text-xs text-muted-foreground">Top {Math.min(areaChart.length, 12)}</p>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={areaChart} barSize={20} margin={{ left: -16, right: 4, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                      interval={0} 
                      height={50} 
                      angle={-20} 
                      textAnchor="end"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={24}
                    />
                    <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Compliance Health + Activity Feed */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card shadow-soft-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Compliance Health</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Approved declarations coverage</p>
              </div>
              <div className={cn(
                "text-sm font-bold tabular-nums",
                compliancePct >= 80 ? "text-emerald-600" : compliancePct >= 50 ? "text-amber-600" : "text-destructive"
              )}>
                {compliancePct}%
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  compliancePct >= 80 ? "bg-emerald-500" : compliancePct >= 50 ? "bg-amber-500" : "bg-destructive"
                )}
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

          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
              </div>
              <button
                onClick={() => navigate(ROUTE_PATHS.DC_TEMPLES)}
                className="flex items-center gap-0.5 text-xs text-primary hover:underline font-medium"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
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
                <button
                  key={notif.id} 
                  onClick={() => onMarkRead(notif.id)}
                  className={cn(
                    "w-full text-left p-4 hover:bg-muted/30 transition-colors relative",
                    !notif.read && "bg-primary/5"
                  )}
                >
                  {!notif.read && <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />}
                  <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-1">{notif.title}</h4>
                  <p className="text-xs font-regular text-muted-foreground mt-1 line-clamp-2">{notif.body}</p>
                  <p className="text-xs font-regular text-muted-foreground/60 mt-2">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>

    </motion.div>
  )
}
