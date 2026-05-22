import { motion } from 'framer-motion'
import { useGetStatewideDashboardQuery, useListAuditEventsQuery, type AuditEventResponse } from '@/features/admin/adminApi'
import { PolicyGate } from '@/features/access-control/components/PolicyGate'
import { TARGET_KEYS } from '@/features/access-control/constants/targetKeys'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { cn } from '@/lib/utils'
import {
  Users, Building2, FileText, ShieldAlert, AlertCircle, Activity,
  BellRing, Wrench, UserCog, TrendingUp, Clock, CheckCircle2,
  AlertTriangle, Shield, BarChart3, ChevronRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, CartesianGrid,
} from 'recharts'
import type { ReactNode } from 'react'

// â”€â”€ Theme colours â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const GOLD    = '#e6a817'
const SAFFRON = '#d97a2b'
const GREEN   = '#2da87e'
const BLUE    = '#2680d9'
const RED     = '#dc2626'
const PURPLE  = '#9b59b6'
const MUTED_C = '#c8c0b6'

const ROLE_COLORS  = [GOLD, BLUE, SAFFRON, GREEN, PURPLE]
const GRADE_COLORS = [GOLD, SAFFRON, '#c47d10', '#a86a0e', MUTED_C]
const STATUS_COLORS = [GREEN, RED, GOLD]

// â”€â”€ Animation variants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
}
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
}

// â”€â”€ Shared recharts tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChartTooltip({ active, payload, label, unit = 'temples' }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string; unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-soft-md">
      {label && <p className="text-xs font-semibold text-foreground">{label}</p>}
      <p className="text-xs text-primary mt-0.5">{payload[0].value.toLocaleString()} {unit}</p>
    </div>
  )
}

// â”€â”€ TA-style KPI card (coloured top accent bar) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatCard({
  label, value, sub, icon, iconBg, iconColor, accentBar, onClick,
}: {
  label: string; value: string | number; sub: string
  icon: ReactNode; iconBg: string; iconColor: string; accentBar: string
  onClick?: () => void
}) {
  const Wrapper = (onClick ? 'button' : 'div') as 'button' | 'div'
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'relative rounded-xl border border-border bg-card px-4 pt-4 pb-3.5 shadow-soft-sm',
        'hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-200',
        'flex items-center gap-3 overflow-hidden text-left w-full',
        onClick && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      )}
    >
      <div className={cn('absolute top-0 left-0 right-0 h-[3px]', accentBar)} />
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconBg)}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-foreground leading-none">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{sub}</p>
      </div>
    </Wrapper>
  )
}

// â”€â”€ Quick-action tile (TA style) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        'group relative flex flex-col gap-2.5 rounded-xl p-3.5 text-left overflow-hidden',
        'border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 active:translate-y-0',
        bg, border,
      )}
    >
      <div className={cn('absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-md', shine)} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none" />
      <div className="relative flex items-start justify-between">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0 shadow-sm ring-1 ring-inset ring-black/[0.06]', iconBg, fg)}>{icon}</span>
        <span className={cn('flex h-5 w-5 items-center justify-center rounded-full shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200', iconBg, fg)}>
          <ChevronRight size={11} />
        </span>
      </div>
      <div className="relative">
        <p className={cn('text-xs font-bold leading-tight', fg)}>{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{sub}</p>
      </div>
    </button>
  )
}

// â”€â”€ Section header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SectionHeader({ icon, title, badge }: { icon: ReactNode; title: string; badge?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-primary">{icon}</span>
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
      {badge && <div className="ml-auto">{badge}</div>}
    </div>
  )
}

// â”€â”€ Page skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DashSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-64 rounded-lg bg-muted" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="xl:col-span-2 h-36 rounded-xl bg-muted" />
        <div className="h-36 rounded-xl bg-muted" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="xl:col-span-2 h-56 rounded-xl bg-muted" />
        <div className="h-56 rounded-xl bg-muted" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="h-52 rounded-xl bg-muted" />
        <div className="h-52 rounded-xl bg-muted" />
      </div>
      <div className="h-48 rounded-xl bg-muted" />
    </div>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { data: dashData, isLoading: dashLoading, isError: dashError } = useGetStatewideDashboardQuery()
  const { data: auditData, isLoading: auditLoading, isError: auditError } = useListAuditEventsQuery({ page: 0, size: 8 })

  const stats      = dashData?.data
  const auditEvents = auditData?.data?.content ?? []

  if (dashLoading) return <DashSkeleton />

  // â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const approvalQueue    = (stats?.totalPendingDeclarations ?? 0) + (stats?.totalPendingProfileReviews ?? 0)
  const overdueCount     = stats?.totalOverdueDeclarations ?? 0
  const operationalUsers = (stats?.totalUsers ?? 0) - (stats?.totalSuperAdmins ?? 0)
  const riskLevel        = overdueCount > 10 ? 'High' : overdueCount > 0 ? 'Medium' : 'Low'

  // â”€â”€ Chart datasets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const districtData = (stats?.districtDistribution ?? [])
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map(d => ({ name: d.districtName ?? `District ${d.districtId}`, value: d.count }))

  const districtTotal = districtData.reduce((s, d) => s + d.value, 0)

  const gradeData = (stats?.gradeDistribution ?? []).map(d => ({
    name: `Grade ${d.grade}`, value: d.count,
  }))

  const templeStatusData = stats ? [
    { name: 'Active',    value: stats.totalActiveTemples },
    { name: 'Suspended', value: stats.totalSuspendedTemples },
    { name: 'Other',     value: Math.max(0, stats.totalTemples - stats.totalActiveTemples - stats.totalSuspendedTemples) },
  ].filter(d => d.value > 0) : []

  const userRoleData = stats ? [
    { name: 'Super Admin',     value: stats.totalSuperAdmins },
    { name: 'Dist. Collector', value: stats.totalDistrictCollectors },
    { name: 'DC Staff',        value: stats.totalDcStaff },
    { name: 'Temple Auth.',    value: stats.totalTempleAuthorities },
    { name: 'Auditors',        value: stats.totalAuditors },
  ].filter(d => d.value > 0) : []

  const userTotal  = userRoleData.reduce((s, d) => s + d.value, 0)
  const gradeTotal = gradeData.reduce((s, d) => s + d.value, 0)
  const topGrade   = gradeData.slice().sort((a, b) => b.value - a.value)[0]
  const activeRate = stats ? Math.round((stats.totalActiveTemples / Math.max(stats.totalTemples, 1)) * 100) : 0

  const GRADE_DESC: Record<string, string> = {
    'Grade A': 'Major / heritage temples',
    'Grade B': 'Mid-size community temples',
    'Grade C': 'Small / local shrines',
  }

  return (
<<<<<<< HEAD
    <motion.div className="space-y-4" initial="hidden" animate="show" variants={stagger}>
=======
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
>>>>>>> 323c71652ba16b9d4e38f3b7bf7ba8b302d135c0

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">Super Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-semibold text-success">System Online</span>
        </div>
      </motion.div>

      {/* â”€â”€ KPI Strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {dashError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load system statistics.</AlertDescription>
        </Alert>
      ) : (
        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5" variants={stagger}>
          {([
            {
              label: 'Total Users',          value: stats?.totalUsers ?? 0,
              sub: `${stats?.totalAuditors ?? 0} auditors / ${stats?.totalDistrictCollectors ?? 0} DCs`,
              icon: <Users size={18} />, iconBg: 'bg-info/10', iconColor: 'text-info',
              accentBar: 'bg-info', to: ROUTE_PATHS.ADMIN_USERS as string | undefined,
            },
            {
              label: 'Temples Registered',   value: stats?.totalTemples ?? 0,
              sub: `${stats?.totalActiveTemples ?? 0} active / ${stats?.totalSuspendedTemples ?? 0} suspended`,
              icon: <Building2 size={18} />, iconBg: 'bg-primary/10', iconColor: 'text-primary',
              accentBar: 'bg-primary', to: undefined,
            },
            {
              label: 'Pending Declarations', value: stats?.totalPendingDeclarations ?? 0,
              sub: `${stats?.totalOverdueDeclarations ?? 0} overdue`,
              icon: <FileText size={18} />, iconBg: 'bg-warning/10', iconColor: 'text-warning',
              accentBar: 'bg-warning', to: undefined,
            },
            {
              label: 'Audit Events (24h)',   value: stats?.recentAuditEventCount ?? 0,
              sub: 'System mutation events',
              icon: <ShieldAlert size={18} />, iconBg: 'bg-destructive/10', iconColor: 'text-destructive',
              accentBar: 'bg-destructive', to: ROUTE_PATHS.ADMIN_AUDIT as string | undefined,
            },
          ]).map(c => (
            <motion.div key={c.label} variants={fadeUp}>
              <StatCard
                label={c.label} value={c.value} sub={c.sub}
                icon={c.icon} iconBg={c.iconBg} iconColor={c.iconColor} accentBar={c.accentBar}
                onClick={c.to ? () => navigate(c.to!) : undefined}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* â”€â”€ Operational Health + Quick Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 xl:grid-cols-3 gap-3">

        <div className="xl:col-span-2 rounded-xl border border-border bg-card p-4">
          <SectionHeader
            icon={<TrendingUp size={13} />}
            title="Operational Health"
            badge={
              <Badge variant={riskLevel === 'High' ? 'destructive' : riskLevel === 'Medium' ? 'secondary' : 'outline'} className="text-[10px] font-bold">
                {riskLevel} Risk
              </Badge>
            }
          />
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Approval Queue',    value: approvalQueue,    sub: 'Declarations + reviews',    icon: <Clock size={13} />,         cls: 'text-warning',          from: 'from-warning/5' },
              { label: 'Operational Users', value: operationalUsers, sub: 'Across all active roles',   icon: <CheckCircle2 size={13} />,   cls: 'text-success',          from: 'from-success/5' },
              { label: 'Overdue',           value: overdueCount,     sub: overdueCount === 0 ? 'All declarations on time' : 'Require attention', icon: overdueCount > 0 ? <AlertTriangle size={13} /> : <Shield size={13} />, cls: overdueCount > 0 ? 'text-destructive' : 'text-muted-foreground', from: overdueCount > 0 ? 'from-destructive/5' : 'from-muted/20' },
            ].map(m => (
              <div key={m.label} className={cn('rounded-lg border border-border bg-gradient-to-br to-transparent p-3', m.from)}>
                <div className={cn('flex items-center gap-1 mb-1.5', m.cls)}>
                  {m.icon}
                  <span className="text-[10px] font-bold uppercase tracking-wide">{m.label}</span>
                </div>
                <p className="text-2xl font-display font-bold leading-none">{m.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <SectionHeader icon={<BarChart3 size={13} />} title="Quick Actions" />
          <div className="grid grid-cols-2 gap-2">
            <QuickAction label="Manage Users"  sub="Roles & access"  icon={<UserCog size={15} />}  to={ROUTE_PATHS.ADMIN_USERS}              bg="bg-sky-50 dark:bg-sky-950/30"       fg="text-sky-600 dark:text-sky-400"       iconBg="bg-sky-100 dark:bg-sky-900/50"       border="border-sky-200 dark:border-sky-800"       shine="bg-sky-200" />
            <QuickAction label="Audit Logs"    sub="Activity trail"  icon={<Activity size={15} />} to={ROUTE_PATHS.ADMIN_AUDIT}              bg="bg-violet-50 dark:bg-violet-950/30" fg="text-violet-600 dark:text-violet-400" iconBg="bg-violet-100 dark:bg-violet-900/50" border="border-violet-200 dark:border-violet-800" shine="bg-violet-200" />
            <QuickAction label="Notifications" sub="Alert rules"     icon={<BellRing size={15} />} to={ROUTE_PATHS.ADMIN_NOTIFICATION_RULES} bg="bg-amber-50 dark:bg-amber-950/30"   fg="text-amber-600 dark:text-amber-400"   iconBg="bg-amber-100 dark:bg-amber-900/50"   border="border-amber-200 dark:border-amber-800"   shine="bg-amber-200" />
            <QuickAction label="Admin Tools"   sub="System config"   icon={<Wrench size={15} />}   to={ROUTE_PATHS.ADMIN_TOOLS}             bg="bg-rose-50 dark:bg-rose-950/30"     fg="text-rose-600 dark:text-rose-400"     iconBg="bg-rose-100 dark:bg-rose-900/50"     border="border-rose-200 dark:border-rose-800"     shine="bg-rose-200" />
          </div>
        </div>
      </motion.div>

      {/* â”€â”€ Charts Row 1: Horizontal district bars + Temple status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 xl:grid-cols-3 gap-3">

        {/* District â€” horizontal BarChart (leaderboard style, sorted by count) */}
        <div className="xl:col-span-2 rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between mb-1">
            <div>
              <SectionHeader icon={<Building2 size={13} />} title="District Load Distribution" />
              <p className="text-[11px] text-muted-foreground -mt-2 mb-3">Temples per district — top 8 ranked</p>
            </div>
            <span className="shrink-0 ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {districtTotal} total
            </span>
          </div>
          {districtData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(districtData.length * 32 + 16, 100)}>
              <BarChart layout="vertical" data={districtData} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#867f77' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#867f77' }} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<ChartTooltip unit="temples" />} cursor={{ fill: 'hsl(35 15% 93% / 0.5)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}
                  label={{ position: 'right', fontSize: 10, fill: '#867f77' }}>
                  {districtData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? GOLD : SAFFRON} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Temple status â€” 3 coloured tiles + mini donut */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
          <SectionHeader icon={<CheckCircle2 size={13} />} title="Temple Status" />
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[
              { name: 'Active',    value: stats?.totalActiveTemples ?? 0,    bg: 'bg-success/10',     text: 'text-success' },
              { name: 'Suspended', value: stats?.totalSuspendedTemples ?? 0, bg: 'bg-destructive/10', text: 'text-destructive' },
              { name: 'Other',     value: Math.max(0, (stats?.totalTemples ?? 0) - (stats?.totalActiveTemples ?? 0) - (stats?.totalSuspendedTemples ?? 0)), bg: 'bg-primary/10', text: 'text-primary' },
            ].map(s => (
              <div key={s.name} className={cn('rounded-lg p-2.5 text-center', s.bg)}>
                <p className={cn('text-lg font-display font-bold leading-none', s.text)}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.name}</p>
              </div>
            ))}
          </div>
          {templeStatusData.length > 0 && (
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={118}>
                <PieChart>
                  <Pie data={templeStatusData} cx="50%" cy="50%" innerRadius={33} outerRadius={51}
                    paddingAngle={3} dataKey="value" label={false}>
                    {templeStatusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip unit="temples" />} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                    <tspan x="50%" dy="-0.2em" fontSize={15} fontWeight={700} fill="hsl(30 10% 15%)">{stats?.totalTemples ?? 0}</tspan>
                    <tspan x="50%" dy="1.2em" fontSize={9} fill="hsl(30 8% 50%)">TOTAL</tspan>
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground text-center mt-1">{activeRate}% of temples are operational</p>
        </div>
      </motion.div>

      {/* â”€â”€ Charts Row 2: User Role stacked bar + Grade mix donut â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 xl:grid-cols-2 gap-3">

        {/* User role breakdown â€” stacked proportion bar + per-role rows */}
        <div className="rounded-xl border border-border bg-card p-4">
          <SectionHeader icon={<Users size={13} />} title="User Role Breakdown" />
          <p className="text-[11px] text-muted-foreground -mt-2 mb-3">{userTotal} accounts across all roles</p>
          {userRoleData.length > 0 && (
            <div className="h-3.5 rounded-full overflow-hidden flex gap-px mb-3">
              {userRoleData.map((item, i) => {
                const pct = userTotal > 0 ? (item.value / userTotal) * 100 : 0
                return (
                  <div key={item.name}
                    style={{ width: `${pct}%`, minWidth: pct > 0 ? 3 : 0, background: ROLE_COLORS[i] }}
                    title={`${item.name}: ${item.value}`}
                  />
                )
              })}
            </div>
          )}
          <div className="space-y-2">
            {userRoleData.map((item, i) => {
              const pct = userTotal > 0 ? Math.round((item.value / userTotal) * 100) : 0
              return (
                <div key={item.name} className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: ROLE_COLORS[i] }} />
                  <span className="text-xs text-muted-foreground w-28 shrink-0">{item.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ROLE_COLORS[i] }} />
                  </div>
                  <span className="text-xs font-bold w-5 text-right shrink-0">{item.value}</span>
                  <span className="text-[10px] text-muted-foreground w-7 text-right shrink-0">{pct}%</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-2.5 border-t border-border flex items-center gap-2">
            <Building2 size={11} className="text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              {stats?.totalTempleAuthorities ?? 0} temple authorities managing {stats?.totalTemples ?? 0} registered temples
            </p>
          </div>
        </div>

        {/* Grade mix â€” donut + ranked detail rows */}
        <div className="rounded-xl border border-border bg-card p-4">
          <SectionHeader icon={<BarChart3 size={13} />} title="Temple Grade Classification" />
          <p className="text-[11px] text-muted-foreground -mt-2 mb-3">
            {topGrade ? `${topGrade.name} is most common (${gradeTotal > 0 ? Math.round(topGrade.value / gradeTotal * 100) : 0}%)` : 'No data available'}
          </p>
          {gradeData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No grade data.</div>
          ) : (
            <div className="flex gap-4 items-start">
              <ResponsiveContainer width="45%" height={155}>
                <PieChart>
                  <Pie data={gradeData} cx="50%" cy="50%" innerRadius={36} outerRadius={56}
                    paddingAngle={3} dataKey="value" label={false}>
                    {gradeData.map((_, i) => <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip unit="temples" />} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                    <tspan x="50%" dy="-0.2em" fontSize={15} fontWeight={700} fill="hsl(30 10% 15%)">{gradeTotal}</tspan>
                    <tspan x="50%" dy="1.2em" fontSize={9} fill="hsl(30 8% 50%)">TEMPLES</tspan>
                  </text>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5 pt-1">
                {gradeData.map((item, i) => {
                  const pct = gradeTotal > 0 ? Math.round((item.value / gradeTotal) * 100) : 0
                  return (
                    <div key={item.name}>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: GRADE_COLORS[i % GRADE_COLORS.length] }} />
                        <span className="text-xs font-bold text-foreground flex-1">{item.name}</span>
                        <span className="text-xs font-bold">{item.value}</span>
                        <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                      </div>
                      <div className="ml-[18px] mt-0.5 h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: GRADE_COLORS[i % GRADE_COLORS.length] }} />
                      </div>
                      {GRADE_DESC[item.name] && (
                        <p className="ml-[18px] text-[10px] text-muted-foreground mt-0.5">{GRADE_DESC[item.name]}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* â”€â”€ Recent Audit Events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={13} className="text-primary" />
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Recent Audit Events</h2>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" className="text-xs h-6 px-2" onClick={() => navigate(ROUTE_PATHS.ADMIN_AUDIT)}>
            View all
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {auditError ? (
            <Alert variant="destructive" className="m-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load audit events.</AlertDescription>
            </Alert>
          ) : auditLoading ? (
            <div className="p-4"><CardSkeleton /></div>
          ) : auditEvents.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No audit events found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[560px] w-full">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    {['Actor', 'Action', 'Entity', 'Time'].map(h => (
                      <th key={h} className="px-4 py-2 text-left font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap" style={{ fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditEvents.map((event: AuditEventResponse, idx: number) => (
                    <tr key={event.id} className={cn('hover:bg-primary/5 transition-colors', idx % 2 !== 0 && 'bg-muted/10')}>
                      <td className="px-4 py-2 text-xs font-medium whitespace-nowrap">
                        {event.actorName ?? `${event.actorRole} #${event.actorId}`}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-mono font-semibold" style={{ fontSize: 10 }}>
                          {event.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {event.entityName ?? `${event.entityType} #${event.entityId}`}
                      </td>
                      <td className="px-4 py-2 text-[11px] text-muted-foreground whitespace-nowrap">
                        {event.occurredAt
                          ? new Date(event.occurredAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

    </motion.div>
  )
}
