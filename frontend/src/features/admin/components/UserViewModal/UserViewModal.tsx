import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User, Mail, Phone, MapPin, Building2, Shield, Clock, CalendarDays,
  CreditCard, Briefcase, Eye, Pencil, CheckCircle2, XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserAdminResponse } from '../../adminApi'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  DISTRICT_COLLECTOR: 'District Collector',
  DC_STAFF: 'DC Staff',
  TEMPLE_AUTHORITY: 'Temple Authority',
  AUDITOR: 'Auditor',
  VIEWER: 'Viewer',
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN:        'bg-violet-100 text-violet-700 border-violet-200',
  DISTRICT_COLLECTOR: 'bg-blue-100 text-blue-700 border-blue-200',
  DC_STAFF:           'bg-sky-100 text-sky-700 border-sky-200',
  TEMPLE_AUTHORITY:   'bg-amber-100 text-amber-700 border-amber-200',
  AUDITOR:            'bg-emerald-100 text-emerald-700 border-emerald-200',
  VIEWER:             'bg-slate-100 text-slate-600 border-slate-200',
}

interface UserViewModalProps {
  user: UserAdminResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function InfoRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType
  label: string
  value?: string | null
  children?: React.ReactNode
}) {
  if (!children && (value == null || value === '')) return null
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {children ?? <p className="mt-0.5 text-sm text-foreground break-all">{value}</p>}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function UserViewModal({ user, open, onOpenChange }: UserViewModalProps) {
  if (!user) return null

  const isTa = user.role === 'TEMPLE_AUTHORITY'
  const maskedAadhaar = user.aadhaarNumber
    ? `XXXX XXXX ${user.aadhaarNumber.slice(-4)}`
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">

        {/* ── Hero header ─────────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-primary/10 via-card to-secondary/5 px-6 pt-6 pb-5">
          <DialogHeader className="sr-only">
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg shadow-sm">
              {initials(user.fullName)}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground truncate">{user.fullName}</h2>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                  ROLE_COLORS[user.role] ?? 'bg-muted text-muted-foreground border-border',
                )}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                  user.active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-600 border-red-200',
                )}>
                  {user.active
                    ? <><CheckCircle2 size={10} />Active</>
                    : <><XCircle size={10} />Inactive</>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto max-h-[60vh] px-6 py-5 space-y-5">

          {/* Contact */}
          <Section title="Contact">
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Phone} label="Mobile" value={user.mobile ?? '—'} />
          </Section>

          <Separator />

          {/* Assignment */}
          <Section title="Assignment">
            <InfoRow icon={MapPin} label="District" value={user.districtName ?? '—'} />
            {isTa && (
              <>
                <InfoRow icon={Building2} label="Temple" value={user.templeName ?? '—'} />
                <InfoRow icon={Briefcase} label="Designation" value={user.designation ?? '—'} />
                <InfoRow icon={Shield} label="Access Type">
                  {user.accessType ? (
                    <div className={cn(
                      'mt-0.5 inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
                      user.accessType === 'EDIT'
                        ? 'bg-primary/5 text-primary border-primary/20'
                        : 'bg-muted text-muted-foreground border-border',
                    )}>
                      {user.accessType === 'EDIT'
                        ? <><Pencil size={11} />Edit Access</>
                        : <><Eye size={11} />View Only</>}
                    </div>
                  ) : <p className="mt-0.5 text-sm text-foreground">—</p>}
                </InfoRow>
              </>
            )}
          </Section>

          {maskedAadhaar && (
            <>
              <Separator />
              <Section title="Identity">
                <InfoRow icon={CreditCard} label="Aadhaar Number" value={maskedAadhaar} />
              </Section>
            </>
          )}

          <Separator />

          {/* System */}
          <Section title="System">
            <InfoRow
              icon={Clock}
              label="Last Login"
              value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
            />
            <InfoRow
              icon={CalendarDays}
              label="Created"
              value={user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
            />
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
