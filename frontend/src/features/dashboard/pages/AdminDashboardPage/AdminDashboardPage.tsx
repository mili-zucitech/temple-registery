import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { useGetStatewideDashboardQuery, useListAuditEventsQuery, type AuditEventResponse } from '@/features/admin/adminApi'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import {
  Users, Building2, FileText, ShieldAlert, AlertCircle, Activity, BellRing,
  Wrench, UserCog, ChevronRight, BarChart3, MapPin, TrendingUp, Clock,
  CheckCircle2, AlertTriangle, Shield,
} from 'lucide-react'

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35 } },
}
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
}

// ─── Grade color palette ──────────────────────────────────────────────────────
const GRADE_COLORS: Record<string, string> = {
  A: 'hsl(var(--success))',
  B: 'hsl(var(--primary))',
  C: 'hsl(var(--warning))',
  D: 'hsl(var(--accent))',
  E: 'hsl(var(--destructive))',
}
const GRADE_FALLBACK = 'hsl(var(--muted-foreground))'

// ─── Quick Action tile ────────────────────────────────────────────────────────
function QuickAction({
  label, sub, icon, to, bg, fg, iconBg, border, shine,
}: {
  label: string; sub: string; icon: ReactNode; to: string
  bg: string; fg: string; iconBg: string; border: string; shine: string
}) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className={cn(
        'group relative flex flex-col gap-3 rounded-2xl p-4 text-left overflow-hidden',
        'border transition-all duration-200 hover:shadow-xl hover:-translate-y-1 active:translate-y-0',
        bg, border,
      )}
    >
      <div className={cn('absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-300 blur-md', shine)} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/35 via-transparent to-transparent dark:from-white/8 pointer-events-none" />
      <div className="relative flex items-start justify-between">
        <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 shadow-sm ring-1 ring-inset ring-black/[0.06]', iconBg, fg)}>
          {icon}
        </span>
        <span className={cn('flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200', iconBg, fg)}>
          <ChevronRight size={12} />
        </span>
      </div>
      <div className="relative">
        <p className={cn('text-sm font-bold leading-tight', fg)}>{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{sub}</p>
      </div>
    </button>
  )
}

// ─── Custom recharts tooltip ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-soft-md">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="text-xs text-primary mt-0.5">{payload[0].value} temple{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ─── Page skeleton ────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-36 rounded-2xl bg-primary/15" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted" />)}
      </div>
      <div className="h-36 rounded-2xl bg-muted" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 h-72 rounded-2xl bg-muted" />
        <div className="lg:col-span-5 h-72 rounded-2xl bg-muted" />
      </div>
      <div className="h-48 rounded-2xl bg-muted" />
    </div>
  )
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { data: dashData, isLoading: dashLoading, isError: dashError } = useGetStatewideDashboardQuery()
  const { data: auditData, isLoading: auditLoading, isError: auditError } = useListAuditEventsQuery({ page: 0, size: 5 })

  const stats = dashData?.data
  const auditEvents = auditData?.data?.content ?? []
  const districtDistribution = stats?.districtDistribution ?? []
  const gradeDistribution = stats?.gradeDistribution ?? []
  const totalByGrade = gradeDistribution.reduce((acc, item) => acc + item.count, 0)

  const approvalQueue = (stats?.totalPendingDeclarations ?? 0) + (stats?.totalPendingProfileReviews ?? 0)
  const operationalUsers = (stats?.totalUsers ?? 0) - (stats?.totalSuperAdmins ?? 0)
  const overdueCount = stats?.totalOverdueDeclarations ?? 0
  const riskLevel = overdueCount > 10 ? 'High' : overdueCount > 0 ? 'Medium' : 'Low'

  if (dashLoading) return <DashboardSkeleton />

  return (
    <motion.div className="space-y-5" initial="hidden" animate="show" variants={stagger}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="relative overflow-hidden rounded-xl bg-gradient-gold px-5 py-4 shadow-gold">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 pointer-events-none" />
          <div className="absolute right-20 -bottom-10 h-28 w-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm">
                <Shield size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-base sm:text-lg font-bold text-white leading-tight">
                  Super Admin — System Command Centre
                </h1>
                <p className="text-[11px] text-white/70 mt-0.5">
                  Karnataka Temple Registry · {stats?.totalTemples ?? 0} temples across {districtDistribution.length} districts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border',
                riskLevel === 'High'   ? 'bg-rose-400/80 border-rose-300/60 text-rose-900'
                : riskLevel === 'Medium' ? 'bg-amber-300/80 border-amber-200/60 text-amber-900'
                : 'bg-emerald-400/80 border-emerald-300/60 text-emerald-900',
              )}>
                <AlertTriangle size={11} />
                {riskLevel} Risk · {overdueCount} overdue
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/25 border border-white/30 px-3 py-1 text-xs font-semibold text-white">
                <Activity size={11} />
                {stats?.recentAuditEventCount ?? 0} events today
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI STRIP ────────────────────────────────────────────────────── */}
      {dashError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load system statistics. Please refresh the page.</AlertDescription>
        </Alert>
      ) : (
        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5" variants={stagger}>
          {([
            {
              label: 'Total Temples',
              value: stats?.totalTemples ?? 0,
              icon: <Building2 size={20} />,
              iconBg: 'bg-primary/10', iconColor: 'text-primary', accentBar: 'bg-primary',
              sub: `${stats?.totalActiveTemples ?? 0} active · ${stats?.totalSuspendedTemples ?? 0} suspended`,
            },
            {
              label: 'Registered Users',
              value: stats?.totalUsers ?? 0,
              icon: <Users size={20} />,
              iconBg: 'bg-success/10', iconColor: 'text-success', accentBar: 'bg-success',
              sub: `${stats?.totalTempleAuthorities ?? 0} TAs · ${stats?.totalDistrictCollectors ?? 0} DCs`,
            },
            {
              label: 'Pending Declarations',
              value: stats?.totalPendingDeclarations ?? 0,
              icon: <FileText size={20} />,
              iconBg: 'bg-warning/10', iconColor: 'text-warning', accentBar: 'bg-warning',
              sub: `${overdueCount} overdue · ${stats?.totalPendingProfileReviews ?? 0} profile reviews`,
            },
            {
              label: 'Audit Events (24h)',
              value: stats?.recentAuditEventCount ?? 0,
              icon: <ShieldAlert size={20} />,
              iconBg: 'bg-info/10', iconColor: 'text-info', accentBar: 'bg-info',
              sub: 'Data mutation events logged today',
            },
          ] as const).map(card => (
            <motion.div
              key={card.label}
              variants={fadeUp}
              className="relative rounded-xl border border-border bg-card px-4 pt-4 pb-3.5 shadow-soft-sm hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 overflow-hidden"
            >
              <div className={cn('absolute top-0 left-0 right-0 h-[3px]', card.accentBar)} />
              <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', card.iconBg)}>
                <span className={card.iconColor}>{card.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">{card.label}</p>
                <p className="mt-0.5 text-xl font-bold text-foreground leading-none">{card.value.toLocaleString()}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{card.sub}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── QUICK ACTIONS ────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card px-5 pt-4 pb-5 shadow-soft-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground">Quick Actions</h2>
          <span className="text-[11px] text-muted-foreground">4 admin functions</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction label="Manage Users"       sub="Create & configure users"    icon={<UserCog size={17} />}   to={ROUTE_PATHS.ADMIN_USERS}               bg="bg-sky-50 dark:bg-sky-950/30"        fg="text-sky-600 dark:text-sky-400"        iconBg="bg-sky-100 dark:bg-sky-900/50"        border="border-sky-200 dark:border-sky-800"        shine="bg-sky-200" />
          <QuickAction label="Audit Logs"         sub="Review mutation history"     icon={<Activity size={17} />}  to={ROUTE_PATHS.ADMIN_AUDIT}               bg="bg-violet-50 dark:bg-violet-950/30"  fg="text-violet-600 dark:text-violet-400"  iconBg="bg-violet-100 dark:bg-violet-900/50"  border="border-violet-200 dark:border-violet-800"  shine="bg-violet-200" />
          <QuickAction label="Notification Rules" sub="Configure alert routing"     icon={<BellRing size={17} />}  to={ROUTE_PATHS.ADMIN_NOTIFICATION_RULES}  bg="bg-amber-50 dark:bg-amber-950/30"    fg="text-amber-600 dark:text-amber-400"    iconBg="bg-amber-100 dark:bg-amber-900/50"    border="border-amber-200 dark:border-amber-800"    shine="bg-amber-200" />
          <QuickAction label="Admin Tools"        sub="System config & utilities"   icon={<Wrench size={17} />}    to={ROUTE_PATHS.ADMIN_TOOLS}               bg="bg-rose-50 dark:bg-rose-950/30"      fg="text-rose-600 dark:text-rose-400"      iconBg="bg-rose-100 dark:bg-rose-900/50"      border="border-rose-200 dark:border-rose-800"      shine="bg-rose-200" />
        </div>
      </motion.div>

      {/* ── OPERATIONAL HEALTH ────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card px-5 pt-4 pb-5 shadow-soft-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Operational Health</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Live workload snapshot across all districts</p>
          </div>
          <span className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border',
            riskLevel === 'High'   ? 'bg-destructive/10 text-destructive border-destructive/30'
            : riskLevel === 'Medium' ? 'bg-warning/10 text-warning border-warning/30'
            : 'bg-success/10 text-success border-success/30',
          )}>
            <TrendingUp size={12} /> Risk: {riskLevel}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: 'Approval Queue',
              value: approvalQueue,
              sub: `${stats?.totalPendingDeclarations ?? 0} declarations + ${stats?.totalPendingProfileReviews ?? 0} profile reviews`,
              icon: <Clock size={18} />,
              iconBg: 'bg-warning/10', iconColor: 'text-warning', accent: 'border-l-warning',
            },
            {
              label: 'Operational Users',
              value: operationalUsers,
              sub: `${stats?.totalTempleAuthorities ?? 0} TAs · ${stats?.totalDistrictCollectors ?? 0} DCs · ${stats?.totalAuditors ?? 0} auditors`,
              icon: <Users size={18} />,
              iconBg: 'bg-info/10', iconColor: 'text-info', accent: 'border-l-info',
            },
            {
              label: 'Overdue Declarations',
              value: overdueCount,
              sub: overdueCount === 0 ? 'All declarations up to date' : `${overdueCount} require immediate attention`,
              icon: overdueCount > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />,
              iconBg: overdueCount > 0 ? 'bg-destructive/10' : 'bg-success/10',
              iconColor: overdueCount > 0 ? 'text-destructive' : 'text-success',
              accent: overdueCount > 0 ? 'border-l-destructive' : 'border-l-success',
            },
          ].map(row => (
            <div
              key={row.label}
              className={cn('rounded-xl border-l-4 border border-border bg-muted/30 px-4 py-4 flex items-center gap-3', row.accent)}
            >
              <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg', row.iconBg)}>
                <span className={row.iconColor}>{row.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{row.label}</p>
                <p className="text-2xl font-bold text-foreground leading-none mt-0.5">{row.value.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{row.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── CHARTS ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* District Temple Distribution — Bar Chart */}
        <motion.div variants={fadeUp} className="lg:col-span-7 rounded-2xl border border-border bg-card p-5 shadow-soft-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">District Temple Distribution</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Temples registered per district — {districtDistribution.length} districts covered
              </p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <BarChart3 size={12} /> {stats?.totalTemples ?? 0} Total
            </span>
          </div>

          {/* Top 3 districts callout */}
          {districtDistribution.length > 0 && (
            <div className="flex items-center gap-4 pb-4 mb-4 border-b border-border flex-wrap">
              {districtDistribution.slice(0, 3).map((d, i) => (
                <div key={d.districtId} className="flex items-center gap-1.5">
                  <MapPin size={12} className={i === 0 ? 'text-primary' : i === 1 ? 'text-accent' : 'text-muted-foreground'} />
                  <span className="text-[11px] font-semibold text-foreground">{d.districtName ?? `District #${d.districtId}`}</span>
                  <span className={cn('rounded-full px-1.5 py-0 text-[10px] font-bold',
                    i === 0 ? 'bg-primary/15 text-primary' : i === 1 ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground',
                  )}>{d.count}</span>
                </div>
              ))}
            </div>
          )}

          {districtDistribution.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No district data available.</div>
          ) : (
            <div className="relative h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={districtDistribution.slice(0, 10).map(d => ({
                    name: d.districtName?.length > 10 ? d.districtName.slice(0, 9) + '…' : (d.districtName ?? `#${d.districtId}`),
                    count: d.count,
                  }))}
                  barSize={18}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Temple Grade Mix — Donut + Legend */}
        <motion.div variants={fadeUp} className="lg:col-span-5 rounded-2xl border border-border bg-card p-5 shadow-soft-sm">
          <h2 className="text-sm font-bold text-foreground">Temple Grade Mix</h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">
            Breakdown of all {totalByGrade} temples by classification grade
          </p>

          {gradeDistribution.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No grade data available.</div>
          ) : (
            <>
              {/* Donut chart centred */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <PieChart width={140} height={140}>
                    <Pie
                      data={gradeDistribution.map(g => ({ value: g.count || 0.01, grade: g.grade }))}
                      cx={65} cy={65}
                      innerRadius={38}
                      outerRadius={62}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {gradeDistribution.map(g => (
                        <Cell key={g.grade} fill={GRADE_COLORS[g.grade] ?? GRADE_FALLBACK} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-foreground leading-none">{totalByGrade}</span>
                    <span className="text-[9px] text-muted-foreground mt-0.5">temples</span>
                  </div>
                </div>
              </div>

              {/* Grade rows */}
              <div className="space-y-2">
                {gradeDistribution.map(item => {
                  const pct = totalByGrade > 0 ? Math.round((item.count / totalByGrade) * 100) : 0
                  const color = GRADE_COLORS[item.grade] ?? GRADE_FALLBACK
                  return (
                    <div key={item.grade} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-extrabold text-white" style={{ backgroundColor: color }}>
                        {item.grade}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-muted-foreground font-medium">Grade {item.grade} temples</span>
                          <span className="font-bold text-foreground">{item.count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ── USER BREAKDOWN ──────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card px-5 pt-4 pb-5 shadow-soft-sm">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-foreground">User Breakdown</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Role distribution across {stats?.totalUsers ?? 0} registered accounts</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { role: 'Temple Authorities', count: stats?.totalTempleAuthorities ?? 0, icon: <Building2 size={16} />, bg: 'bg-primary/10', fg: 'text-primary', bar: 'bg-primary' },
            { role: 'District Collectors', count: stats?.totalDistrictCollectors ?? 0, icon: <MapPin size={16} />, bg: 'bg-success/10', fg: 'text-success', bar: 'bg-success' },
            { role: 'Auditors', count: stats?.totalAuditors ?? 0, icon: <ShieldAlert size={16} />, bg: 'bg-info/10', fg: 'text-info', bar: 'bg-info' },
            { role: 'DC Staff', count: stats?.totalDcStaff ?? 0, icon: <Users size={16} />, bg: 'bg-accent/10', fg: 'text-accent', bar: 'bg-accent' },
          ].map(row => {
            const pct = (stats?.totalUsers ?? 0) > 0 ? Math.round((row.count / (stats?.totalUsers ?? 1)) * 100) : 0
            return (
              <div key={row.role} className="rounded-xl border border-border bg-muted/20 px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', row.bg)}>
                    <span className={row.fg}>{row.icon}</span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground leading-tight">{row.role}</span>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground leading-none">{row.count}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% of total users</p>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-500', row.bar)} style={{ width: `${Math.max(pct, 3)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* ── RECENT AUDIT EVENTS ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">Recent Audit Events</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Last 5 data mutation events across the platform</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate(ROUTE_PATHS.ADMIN_AUDIT)}>
            <Activity size={13} /> View All Logs
          </Button>
        </div>
        <div className="rounded-2xl border border-border bg-card overflow-x-auto shadow-soft-sm">
          {auditError ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load audit events.</AlertDescription>
            </Alert>
          ) : auditLoading ? (
            <div className="p-6 animate-pulse space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted" />)}
            </div>
          ) : auditEvents.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">No audit events found.</div>
          ) : (
            <table className="min-w-[600px] w-full text-sm">
              <thead className="sticky top-0 border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Actor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditEvents.map((event: AuditEventResponse) => (
                  <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold flex-shrink-0">
                          {(event.actorName ?? event.actorRole).charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-foreground">{event.actorName ?? `${event.actorRole} #${event.actorId}`}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground">{event.action}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{event.entityName ?? `${event.entityType} #${event.entityId}`}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {event.occurredAt ? new Date(event.occurredAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

    </motion.div>
  )
}
