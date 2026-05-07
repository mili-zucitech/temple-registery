import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import { useListDeclarationsQuery } from '@/features/declaration/declarationApi'
import { useListNotificationsQuery } from '@/features/notification/notificationApi'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { Button } from '@/components/ui/button'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { cn } from '@/lib/utils'
import {
  Building2, Users, Wrench, ClipboardList, FileText, Shield,
  CheckCircle2, Clock, XCircle, AlertTriangle, ChevronRight,
  MapPin, Bell, Pencil, BarChart3, Download,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useGetTempleByIdQuery } from '@/features/temple-profile/hooks/templeApi'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChecklistStatus = 'complete' | 'pending' | 'rejected' | 'incomplete'

interface ChecklistItem {
  label: string
  sub: string
  status: ChecklistStatus
  to: string
}

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35 } },
}
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lastSixMonths() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return {
      label:    d.toLocaleString('en-IN', { month: 'short' }),
      year:     d.getFullYear(),
      monthIdx: d.getMonth(),
    }
  })
}

function fmtDate(iso: string | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Custom recharts tooltip ──────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-soft-md">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="text-xs text-primary mt-0.5">
        {payload[0].value} submission{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ─── Status icon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: ChecklistStatus }) {
  switch (status) {
    case 'complete':   return <CheckCircle2 size={18} className="text-success flex-shrink-0" />
    case 'pending':    return <Clock        size={18} className="text-warning flex-shrink-0" />
    case 'rejected':   return <XCircle      size={18} className="text-destructive flex-shrink-0" />
    default:           return <AlertTriangle size={18} className="text-muted-foreground flex-shrink-0" />
  }
}

const BADGE_CLS: Record<ChecklistStatus, string> = {
  complete:   'bg-success/10 text-success border-success/20',
  pending:    'bg-warning/10 text-warning border-warning/20',
  rejected:   'bg-destructive/10 text-destructive border-destructive/20',
  incomplete: 'bg-muted text-muted-foreground border-border',
}
const BADGE_LBL: Record<ChecklistStatus, string> = {
  complete: 'Complete', pending: 'Pending', rejected: 'Rejected', incomplete: 'Incomplete',
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
      <div className="h-44 rounded-2xl bg-primary/15" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-40 rounded-2xl bg-muted" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 h-64 rounded-2xl bg-muted" />
        <div className="lg:col-span-5 h-64 rounded-2xl bg-muted" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 rounded-2xl bg-muted" />
        <div className="h-72 rounded-2xl bg-muted" />
      </div>
      <div className="h-40 rounded-2xl bg-muted" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TaDashboardPage() {
  const navigate = useNavigate()

  const { data: userData, isLoading: userLoading }     = useGetCurrentUserQuery()
  const user      = userData?.data
  const checklist = user?.completionChecklist
  const templeId  = user?.templeId

  const { data: templeData, isLoading: templeLoading } = useGetTempleByIdQuery(
    templeId!, { skip: !templeId },
  )
  const temple = templeData?.data

  const { data: declData, isLoading: declLoading } = useListDeclarationsQuery(
    { templeId: templeId!, page: 0, size: DEFAULT_PAGE_SIZE },
    { skip: !templeId },
  )
  const declarations      = declData?.data?.content ?? []
  const totalDeclarations = declData?.data?.totalElements ?? 0
  const latestDeclaration = declarations[0]

  const { data: notifData } = useListNotificationsQuery({ page: 0, size: 4 })
  const notifications = notifData?.data?.content ?? []

  const isLoading = userLoading || templeLoading || declLoading

<<<<<<< HEAD
  // Normalise backend status: PENDING_REVIEW is the DB value; SUBMITTED is the display value
  const profileStatus = (() => {
    const raw = checklist?.templeProfileStatus
    if (raw === 'PENDING_REVIEW' || raw === 'SUBMITTED') return 'SUBMITTED'
    return raw
  })()

=======
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
  // ── Compliance checklist items ─────────────────────────────────────────────
  const checklistItems: ChecklistItem[] = [
    {
      label: 'Temple Profile',
<<<<<<< HEAD
      sub: profileStatus === 'APPROVED'  ? 'Approved by District Collector'
         : profileStatus === 'SUBMITTED' ? 'Under DC review'
         : profileStatus                 ? `Status: ${profileStatus}`
         : 'Not submitted yet',
      status: profileStatus === 'APPROVED'  ? 'complete'
            : profileStatus === 'SUBMITTED' ? 'pending'
            : profileStatus === 'REJECTED'  ? 'rejected'
=======
      sub: checklist?.templeProfileStatus === 'APPROVED'  ? 'Approved by District Collector'
         : checklist?.templeProfileStatus === 'SUBMITTED' ? 'Under DC review'
         : checklist?.templeProfileStatus                 ? `Status: ${checklist.templeProfileStatus}`
         : 'Not submitted yet',
      status: checklist?.templeProfileStatus === 'APPROVED'  ? 'complete'
            : checklist?.templeProfileStatus === 'SUBMITTED' ? 'pending'
            : checklist?.templeProfileStatus === 'REJECTED'  ? 'rejected'
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
            : 'incomplete',
      to: ROUTE_PATHS.TA_TEMPLE,
    },
    {
      label: 'Trust Registration',
      sub: checklist?.trustExists ? 'Trust registered' : 'Not registered',
      status: checklist?.trustExists ? 'complete' : 'incomplete',
      to: ROUTE_PATHS.TA_TRUST,
    },
    {
      label: 'Asset Declaration (FY 25-26)',
      sub: latestDeclaration
        ? `Status: ${latestDeclaration.status}${latestDeclaration.submittedAt ? ' · ' + fmtDate(latestDeclaration.submittedAt) : ''}`
        : 'Not filed',
      status: latestDeclaration?.status === 'APPROVED' ? 'complete'
            : (latestDeclaration?.status === 'SUBMITTED' || latestDeclaration?.status === 'CLARIFICATION_REQUIRED') ? 'pending'
            : latestDeclaration?.status === 'REJECTED'  ? 'rejected'
            : 'incomplete',
      to: ROUTE_PATHS.TA_DECLARATIONS,
    },
    {
      label: 'Employee Records',
      sub: `${checklist?.employeeCount ?? 0} active employees on record`,
      status: (checklist?.employeeCount ?? 0) > 0 ? 'complete' : 'incomplete',
      to: ROUTE_PATHS.TA_EMPLOYEES,
    },
    {
      label: 'Contractor Records',
      sub: `${checklist?.contractorCount ?? 0} contractors registered`,
      status: (checklist?.contractorCount ?? 0) > 0 ? 'complete' : 'incomplete',
      to: ROUTE_PATHS.TA_CONTRACTORS,
    },
  ]

  const completedCount = checklistItems.filter(i => i.status === 'complete').length
  const completionPct  = Math.round((completedCount / checklistItems.length) * 100)

  // ── Declaration status counts ──────────────────────────────────────────────
  const approvedCount = declarations.filter(d => d.status === 'APPROVED').length
  const pendingCount  = declarations.filter(d => d.status === 'SUBMITTED' || d.status === 'CLARIFICATION_REQUIRED').length
  const rejectedCount = declarations.filter(d => d.status === 'REJECTED').length
  const draftCount    = declarations.filter(d => d.status === 'DRAFT').length

  // ── Chart data — last 6 months ─────────────────────────────────────────────
  const chartData = lastSixMonths().map(({ label, year, monthIdx }) => ({
    month: label,
    count: declarations.filter(d => {
      if (!d.submittedAt) return false
      const dt = new Date(d.submittedAt)
      return dt.getFullYear() === year && dt.getMonth() === monthIdx
    }).length,
  }))

  if (isLoading) return <DashboardSkeleton />

  return (
    <motion.div className="space-y-5" initial="hidden" animate="show" variants={stagger}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="relative overflow-hidden rounded-xl bg-gradient-gold px-5 py-3.5 shadow-gold">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 pointer-events-none" />
          <div className="absolute right-20 -bottom-10 h-28 w-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4">
            {/* Left: identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm">
                <Building2 size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h1 className="font-display text-base sm:text-lg font-bold text-white leading-tight">
                    {temple?.name ?? 'Your Temple'}
                  </h1>
                  {temple?.grade && (
                    <span className="inline-flex items-center rounded-full bg-amber-400 border border-amber-300/60 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900 shadow-sm">
                      Grade {temple.grade}
                    </span>
                  )}
<<<<<<< HEAD
                  {profileStatus && (
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                      profileStatus === 'APPROVED'
                        ? 'bg-emerald-400 border-emerald-300/60 text-emerald-900'
                        : profileStatus === 'SUBMITTED'
                          ? 'bg-sky-300 border-sky-200/60 text-sky-900'
                          : profileStatus === 'REJECTED'
                            ? 'bg-rose-400 border-rose-300/60 text-rose-900'
                            : 'bg-white/15 border-white/25 text-white/80',
                    )}>
                      {profileStatus}
=======
                  {checklist?.templeProfileStatus && (
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                      checklist.templeProfileStatus === 'APPROVED'
                        ? 'bg-emerald-400 border-emerald-300/60 text-emerald-900'
                        : checklist.templeProfileStatus === 'SUBMITTED'
                          ? 'bg-sky-300 border-sky-200/60 text-sky-900'
                          : checklist.templeProfileStatus === 'REJECTED'
                            ? 'bg-rose-400 border-rose-300/60 text-rose-900'
                            : 'bg-white/15 border-white/25 text-white/80',
                    )}>
                      {checklist.templeProfileStatus}
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/70 mt-0.5 truncate">
                  Reg. No: KA-{(temple?.districtId ?? 0).toString().padStart(3, '0')}-{new Date().getFullYear()}-{(temple?.id ?? 0).toString().padStart(5, '0')}
                  {temple?.tradition && ` · ${temple.tradition.charAt(0) + temple.tradition.slice(1).toLowerCase()} Tradition`}
                  {temple?.city && ` · `}
                  {temple?.city && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin size={10} className="inline" />{temple.city}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Right: completion + edit */}
            <div className="flex-shrink-0 py-3 flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-28 rounded-full bg-white/25 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-700"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                  <span className="text-sm font-extrabold text-white tabular-nums">{completionPct}%</span>
                </div>
                <p className="text-[10px] text-white/70">{completedCount}/{checklistItems.length} requirements complete</p>
              </div>
              <button
                onClick={() => navigate(ROUTE_PATHS.TA_TEMPLE)}
                className="flex items-center gap-1.5 rounded-lg bg-white/25 border border-white/30 hover:bg-white/40 transition-colors px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Pencil size={12} />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI STRIP ────────────────────────────────────────────────────── */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5" variants={stagger}>
        {([
          {
            label: 'Profile Status',
<<<<<<< HEAD
            value: profileStatus ?? 'Not Started',
=======
            value: checklist?.templeProfileStatus ?? 'Not Started',
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
            icon: <Building2 size={20} />,
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
            accentBar: 'bg-primary',
            sub: 'Temple profile review',
          },
          {
            label: 'Total Staff',
            value: checklist?.employeeCount ?? 0,
            icon: <Users size={20} />,
            iconBg: 'bg-success/10',
            iconColor: 'text-success',
            accentBar: 'bg-success',
            sub: 'Active employee records',
          },
          {
            label: 'Declarations',
            value: totalDeclarations,
            icon: <ClipboardList size={20} />,
            iconBg: 'bg-info/10',
            iconColor: 'text-info',
            accentBar: 'bg-info',
            sub: latestDeclaration ? `Latest: ${latestDeclaration.status}` : 'Not filed yet',
          },
          {
            label: 'Contractors',
            value: checklist?.contractorCount ?? 0,
            icon: <Wrench size={20} />,
            iconBg: 'bg-accent/10',
            iconColor: 'text-accent',
            accentBar: 'bg-accent',
            sub: 'Service providers',
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
              <p className="mt-0.5 text-xl font-bold text-foreground leading-none">{card.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{card.sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── QUICK ACTIONS ────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card px-5 pt-4 pb-5 shadow-soft-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground">Quick Actions</h2>
          <span className="text-[11px] text-muted-foreground">6 actions available</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickAction label="Update Profile"   sub="Edit temple details"   icon={<Pencil size={17} />}        to={ROUTE_PATHS.TA_TEMPLE}          bg="bg-orange-50 dark:bg-orange-950/30"  fg="text-orange-600 dark:text-orange-400"  iconBg="bg-orange-100 dark:bg-orange-900/50"  border="border-orange-200 dark:border-orange-800"  shine="bg-orange-200" />
          <QuickAction label="Submit Assets"    sub="Annual declaration"    icon={<ClipboardList size={17} />} to={ROUTE_PATHS.TA_DECLARATION_NEW} bg="bg-emerald-50 dark:bg-emerald-950/30" fg="text-emerald-600 dark:text-emerald-400" iconBg="bg-emerald-100 dark:bg-emerald-900/50" border="border-emerald-200 dark:border-emerald-800" shine="bg-emerald-200" />
          <QuickAction label="Manage Staff"     sub="Employees & priests"   icon={<Users size={17} />}         to={ROUTE_PATHS.TA_EMPLOYEES}       bg="bg-sky-50 dark:bg-sky-950/30"        fg="text-sky-600 dark:text-sky-400"        iconBg="bg-sky-100 dark:bg-sky-900/50"        border="border-sky-200 dark:border-sky-800"        shine="bg-sky-200" />
          <QuickAction label="Trust Details"    sub="Board & registration"  icon={<Shield size={17} />}        to={ROUTE_PATHS.TA_TRUST}           bg="bg-violet-50 dark:bg-violet-950/30"  fg="text-violet-600 dark:text-violet-400"  iconBg="bg-violet-100 dark:bg-violet-900/50"  border="border-violet-200 dark:border-violet-800"  shine="bg-violet-200" />
          <QuickAction label="Upload Documents" sub="Files & photos"        icon={<Download size={17} />}      to={ROUTE_PATHS.TA_DOCUMENTS}       bg="bg-amber-50 dark:bg-amber-950/30"    fg="text-amber-600 dark:text-amber-400"    iconBg="bg-amber-100 dark:bg-amber-900/50"    border="border-amber-200 dark:border-amber-800"    shine="bg-amber-200" />
          <QuickAction label="View Compliance"  sub="Audit & checklist"     icon={<FileText size={17} />}      to={ROUTE_PATHS.TA_PROFILE_STATUS}  bg="bg-rose-50 dark:bg-rose-950/30"      fg="text-rose-600 dark:text-rose-400"      iconBg="bg-rose-100 dark:bg-rose-900/50"      border="border-rose-200 dark:border-rose-800"      shine="bg-rose-200" />
        </div>
      </motion.div>

      {/* ── DECLARATION CHART + WORKFORCE ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Declaration history bar chart */}
        <motion.div variants={fadeUp} className="lg:col-span-7 rounded-2xl border border-border bg-card p-5 shadow-soft-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Declaration History</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly submission activity — current year</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <BarChart3 size={12} /> {totalDeclarations} Total
            </span>
          </div>

          {/* Micro-stats row */}
          <div className="flex items-center gap-5 pb-4 mb-4 border-b border-border">
            {[
              { label: 'Total',    value: totalDeclarations, cls: 'text-foreground' },
              { label: 'Approved', value: approvedCount,     cls: 'text-success' },
              { label: 'Pending',  value: pendingCount,      cls: 'text-warning' },
              { label: 'Drafts',   value: draftCount,        cls: 'text-muted-foreground' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className={cn('text-base font-bold', s.cls)}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="relative h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={20} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false} tickLine={false} width={24}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {totalDeclarations === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs font-medium text-muted-foreground/50">No submissions yet</p>
                <button
                  className="pointer-events-auto mt-2 text-[11px] text-primary hover:underline font-medium"
                  onClick={() => navigate(ROUTE_PATHS.TA_DECLARATION_NEW)}
                >
                  File first declaration →
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Staff & Employees panel */}
        <motion.div variants={fadeUp} className="lg:col-span-5 rounded-2xl border border-border bg-card p-5 shadow-soft-sm">
          <h2 className="text-sm font-bold text-foreground">Staff & Employees</h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">Current temple workforce</p>

          <div className="flex flex-col items-center pb-5 mb-4 border-b border-border gap-2">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/20 ring-4 ring-primary/10 shadow-sm">
              <p className="text-3xl font-extrabold text-foreground leading-none">
                {(checklist?.employeeCount ?? 0) + (checklist?.contractorCount ?? 0)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Total Personnel</p>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Employees',           count: checklist?.employeeCount  ?? 0, bg: 'bg-primary/10', fg: 'text-primary', icon: <Users size={15} />,   to: ROUTE_PATHS.TA_EMPLOYEES   },
              { label: 'Contractors',          count: checklist?.contractorCount ?? 0, bg: 'bg-accent/10',  fg: 'text-accent',  icon: <Wrench size={15} />,  to: ROUTE_PATHS.TA_CONTRACTORS },
              { label: 'Trust Board Members',  count: checklist?.trustExists ? '—' : 0, bg: 'bg-info/10',    fg: 'text-info',    icon: <Shield size={15} />,  to: ROUTE_PATHS.TA_TRUST       },
            ].map(row => (
              <button
                key={row.label}
                onClick={() => navigate(row.to)}
                className="w-full flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:bg-muted/30 transition-colors group"
              >
                <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', row.bg)}>
                  <span className={row.fg}>{row.icon}</span>
                </div>
                <span className="flex-1 text-left text-sm font-medium text-foreground">{row.label}</span>
                <span className={cn('rounded-full px-2.5 py-0.5 text-sm font-bold min-w-[2rem] text-center', row.bg, row.fg)}>{row.count}</span>
                <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </button>
            ))}
          </div>

          <Button
            variant="outline" size="sm"
            className="w-full mt-4 text-xs"
            onClick={() => navigate(ROUTE_PATHS.TA_EMPLOYEES)}
          >
            Manage Workforce
          </Button>
        </motion.div>
      </div>

      {/* ── MY SUBMISSIONS + COMPLIANCE CHECKLIST ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* My Submissions */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card shadow-soft-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">My Submissions</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Track status of data submitted to DC office</p>
              </div>
              {/* Status donut */}
              {totalDeclarations > 0 && (
                <div className="relative flex-shrink-0">
                  <PieChart width={52} height={52}>
                    <Pie
                      data={[
                        { value: approvedCount || 0.01 },
                        { value: pendingCount  || 0.01 },
                        { value: rejectedCount || 0.01 },
                        { value: draftCount    || 0.01 },
                      ]}
                      cx={22} cy={22}
                      innerRadius={14}
                      outerRadius={24}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      <Cell fill="hsl(var(--success))" />
                      <Cell fill="hsl(var(--warning))" />
                      <Cell fill="hsl(var(--destructive))" />
                      <Cell fill="hsl(var(--muted-foreground))" />
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-foreground">{totalDeclarations}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-4 border-b border-border">
            {[
              { label: 'Approved', count: approvedCount, cls: 'text-success bg-success/5' },
              { label: 'Pending',  count: pendingCount,  cls: 'text-warning bg-warning/5' },
              { label: 'Rejected', count: rejectedCount, cls: 'text-destructive bg-destructive/5' },
              { label: 'Drafts',   count: draftCount,    cls: 'text-muted-foreground bg-muted' },
            ].map(item => (
              <div
                key={item.label}
                className={cn('flex flex-col items-center justify-center py-3 border-r last:border-r-0 border-border', item.cls)}
              >
                <p className="text-xl font-bold leading-none">{item.count}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide mt-0.5 opacity-75">{item.label}</p>
              </div>
            ))}
          </div>

          {declarations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <ClipboardList size={36} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground">No submissions yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Submit your first declaration to the District Collector.</p>
              <Button size="sm" className="bg-gradient-gold shadow-gold text-xs" onClick={() => navigate(ROUTE_PATHS.TA_DECLARATION_NEW)}>
                File Declaration
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {declarations.slice(0, 5).map(dec => {
                const iconStatus: ChecklistStatus =
                  dec.status === 'APPROVED'  ? 'complete' :
                  dec.status === 'REJECTED'  ? 'rejected' :
                  (dec.status === 'SUBMITTED' || dec.status === 'CLARIFICATION_REQUIRED') ? 'pending' :
                  'incomplete'
                return (
                  <button
                    key={dec.id}
                    onClick={() => navigate(ROUTE_PATHS.TA_DECLARATION_DETAIL.replace(':id', String(dec.id)))}
                    className="w-full flex items-center gap-3 pl-4 pr-5 py-3.5 hover:bg-muted/30 transition-colors group text-left relative"
                  >
                    <div className={cn('absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full', {
                      'bg-success': iconStatus === 'complete',
                      'bg-warning': iconStatus === 'pending',
                      'bg-destructive': iconStatus === 'rejected',
                      'bg-muted-foreground/30': iconStatus === 'incomplete',
                    })} />
                    <StatusIcon status={iconStatus} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Declaration #{String(dec.id).padStart(4, '0')}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(dec.submittedAt ?? undefined)}</p>
                    </div>
                    <StatusBadge status={dec.status} />
                    <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          )}

          {totalDeclarations > 5 && (
            <div className="px-5 py-3 border-t border-border">
              <button
                onClick={() => navigate(ROUTE_PATHS.TA_DECLARATIONS)}
                className="text-xs text-primary hover:underline font-medium"
              >
                View all {totalDeclarations} declarations →
              </button>
            </div>
          )}
        </motion.div>

        {/* Compliance Checklist */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card shadow-soft-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Compliance Checklist</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{completedCount}/{checklistItems.length} requirements met</p>
              </div>
              {/* Donut chart showing completion */}
              <div className="relative flex-shrink-0">
                <PieChart width={56} height={56}>
                  <Pie
                    data={[
                      { value: completedCount },
                      { value: checklistItems.length - completedCount },
                    ]}
                    cx={24} cy={24}
                    innerRadius={16}
                    outerRadius={26}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    <Cell fill="hsl(var(--success))" />
                    <Cell fill="hsl(var(--border))" />
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-extrabold text-foreground">{completionPct}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {checklistItems.map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.to)}
                className="w-full flex items-center gap-3 pl-4 pr-5 py-3.5 hover:bg-muted/30 transition-colors group text-left relative"
              >
                <div className={cn('absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full', {
                  'bg-success': item.status === 'complete',
                  'bg-warning': item.status === 'pending',
                  'bg-destructive': item.status === 'rejected',
                  'bg-muted-foreground/30': item.status === 'incomplete',
                })} />
                <StatusIcon status={item.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                </div>
                <span className={cn(
                  'flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  BADGE_CLS[item.status],
                )}>
                  {BADGE_LBL[item.status]}
                </span>
                <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── NOTICES & ALERTS ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card shadow-soft-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Notices & Alerts</h2>
          </div>
          <button
            onClick={() => navigate(ROUTE_PATHS.TA_ACTIVITY)}
            className="flex items-center gap-0.5 text-xs text-primary hover:underline font-medium"
          >
            View all <ChevronRight size={12} />
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <Bell size={36} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium text-foreground">No notices</p>
            <p className="text-xs text-muted-foreground mt-1">Alerts from the DC office will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.slice(0, 3).map((n, idx) => (
              <button
                key={n.id}
                onClick={() => navigate(ROUTE_PATHS.TA_ACTIVITY)}
                className="w-full flex items-start gap-3 pl-4 pr-5 py-4 hover:bg-muted/20 transition-colors text-left group relative"
              >
                <div className={cn(
                  'absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full',
                  (!n.read || idx === 0) ? 'bg-destructive' : 'bg-primary/30',
                )} />
                <div className={cn(
                  'mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
                  (!n.read || idx === 0) ? 'bg-destructive/10' : 'bg-primary/10',
                )}>
                  <Bell size={13} className={cn((!n.read || idx === 0) ? 'text-destructive' : 'text-primary')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm leading-snug', !n.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
                      {n.title}
                    </p>
                    {(!n.read || idx === 0) && (
                      <span className="flex-shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-destructive">New</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1.5">{fmtDate(n.createdAt)}</p>
                </div>
                <ChevronRight size={13} className="mt-1 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </motion.div>

    </motion.div>
  )
}


