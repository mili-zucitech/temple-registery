import { Users, CheckCircle2, Flag, Clock, Hash, Phone, MapPin } from 'lucide-react'
import { useMemo } from 'react'
import { SectionCard } from '../components'
import { GovernanceActionPanel } from '@/features/dc/components/GovernanceActionPanel/GovernanceActionPanel'
import { ModuleStatusBadge, deriveModuleStatus, type ModuleVerificationStatus } from '@/features/dc/components/ModuleStatusBadge/ModuleStatusBadge'
import { cn } from '@/lib/utils'
import type { EmployeeSummary } from '@/features/dc/dcTypes'

interface StaffTabProps {
  employees: EmployeeSummary[]
  canAct: boolean
  templeId: number
  /** Called once for the whole module — NOT per employee. */
  onVerifyStaff: (notes: string) => Promise<void>
  /** Called once for the whole module — NOT per employee. */
  onFlagStaff: (reason: string) => Promise<void>
}

/**
 * Staff tab — module-level verification.
 *
 * ONE GovernanceActionPanel for the entire Staff module.
 * No per-employee verify/flag buttons.
 * No API loops.
 *
 * Module status rules:
 *   - Any employee flagged → FLAGGED
 *   - All employees verified → VERIFIED
 *   - Otherwise → PENDING
 *
 * Oversight block is shown ONLY when status === PENDING.
 * After TA edits any employee (backend resets isVerifiedByDc), status returns to PENDING
 * and the oversight block reappears automatically on next profile load.
 */
export function StaffTab({ employees, canAct, onVerifyStaff, onFlagStaff }: StaffTabProps) {
  const moduleStatus: ModuleVerificationStatus = useMemo(() => {
    if (employees.length === 0) return 'PENDING'
    if (employees.some(e => e.dcFlagReason)) return 'FLAGGED'
    if (employees.every(e => e.isVerifiedByDc)) return 'VERIFIED'
    return 'PENDING'
  }, [employees])

  const moduleFlagReason = useMemo(
    () => employees.find(e => e.dcFlagReason)?.dcFlagReason ?? null,
    [employees]
  )

  return (
    <div className="animate-in fade-in duration-500 space-y-4">
      <SectionCard
        title="Temple Workforce"
        icon={<Users size={18} />}
        action={
          employees.length > 0
            ? <ModuleStatusBadge status={moduleStatus} />
            : (
              <span className="text-xs font-medium uppercase tracking-label px-3 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10">
                0 Members
              </span>
            )
        }
      >
        {employees.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <Users size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-2">No workforce records</p>
            <p className="text-xs text-slate-500 max-w-[280px]">Employee details have not been registered for this temple.</p>
          </div>
        ) : (
          <>
            {/* Employee list — read-only display, no action buttons per row */}
            <div className="overflow-x-auto -mx-5 -mt-1">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Employee</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden sm:table-cell">Designation</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden md:table-cell">Contact</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((e) => {
                    const itemStatus = deriveModuleStatus(e.isVerifiedByDc, e.dcFlagReason)
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-sm text-slate-900">{e.fullName}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                            <Hash size={10} className="text-slate-400" /> {e.employeeRef || 'No Ref'}
                          </div>
                          {e.dateOfJoining && (
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Clock size={10} /> Joined {new Date(e.dateOfJoining).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </div>
                          )}
                          {e.dcFlagReason && (
                            <div className="text-xs text-red-600 mt-1">⚑ {e.dcFlagReason}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <div className="text-sm text-slate-700 font-semibold">{e.designation || '—'}</div>
                          <span className="text-xs font-medium uppercase tracking-label px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 mt-1 inline-block">
                            {e.employeeType || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          {e.mobile && (
                            <div className="text-xs text-slate-600 flex items-center gap-1.5">
                              <Phone size={10} className="text-slate-400" /> {e.mobile}
                            </div>
                          )}
                          {e.address && (
                            <div className="text-xs text-slate-500 flex items-start gap-1.5 max-w-[180px] leading-tight mt-1">
                              <MapPin size={10} className="text-slate-400 mt-0.5 shrink-0" /> {e.address}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={cn(
                              'text-xs font-medium uppercase tracking-label px-2.5 py-1 rounded border',
                              e.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            )}>
                              {e.status}
                            </span>
                            <ModuleStatusBadge status={itemStatus} className="text-[10px] py-0.5 px-2" />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Module-level oversight block ─────────────────────────────── */}
            {/* ONE block for the whole Staff module. Shown ONLY when PENDING. */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              {moduleStatus === 'PENDING' && (
                <GovernanceActionPanel
                  entityName="Staff Module"
                  isVerified={false}
                  flagReason={null}
                  canAct={canAct}
                  onVerify={onVerifyStaff}
                  onFlag={onFlagStaff}
                />
              )}
              {moduleStatus === 'VERIFIED' && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 px-5 py-4">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Staff module verified</p>
                    <p className="text-xs text-emerald-700/70 mt-0.5">All employee records have been audited and approved.</p>
                  </div>
                </div>
              )}
              {moduleStatus === 'FLAGGED' && (
                <div className="rounded-xl border border-red-100 bg-red-50/40 px-5 py-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <Flag size={16} className="text-red-600 shrink-0" />
                    <p className="text-sm font-semibold text-red-800">Staff module flagged</p>
                  </div>
                  {moduleFlagReason && (
                    <p className="text-xs text-red-700 pl-7">{moduleFlagReason}</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </SectionCard>
    </div>
  )
}
