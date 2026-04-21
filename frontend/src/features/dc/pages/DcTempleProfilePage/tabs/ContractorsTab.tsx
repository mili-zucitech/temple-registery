import { Briefcase, Calendar, Receipt, Hash, CreditCard, CheckCircle2, Flag } from 'lucide-react'
import { useMemo } from 'react'
import { SectionCard } from '../components'
import { GovernanceActionPanel } from '@/features/dc/components/GovernanceActionPanel/GovernanceActionPanel'
import { ModuleStatusBadge, deriveModuleStatus, type ModuleVerificationStatus } from '@/features/dc/components/ModuleStatusBadge/ModuleStatusBadge'
import { formatCurrency } from '../utils'
import type { ContractorResponse } from '@/features/dc/dcTypes'

interface ContractorsTabProps {
  contractors: ContractorResponse[]
  canAct: boolean
  templeId: number
  /** Called once for the whole module — NOT per contractor. */
  onVerifyContractors: (notes: string) => Promise<void>
  /** Called once for the whole module — NOT per contractor. */
  onFlagContractors: (reason: string) => Promise<void>
}

/**
 * Contractors tab — module-level verification.
 *
 * ONE GovernanceActionPanel for the entire Contractors module.
 * No per-contractor verify/flag buttons.
 * No API loops.
 *
 * Module status rules:
 *   - Any contractor flagged → FLAGGED
 *   - All contractors verified → VERIFIED
 *   - Otherwise → PENDING
 *
 * Oversight block shown ONLY when status === PENDING.
 */
export function ContractorsTab({ contractors, canAct, onVerifyContractors, onFlagContractors }: ContractorsTabProps) {
  const moduleStatus: ModuleVerificationStatus = useMemo(() => {
    if (contractors.length === 0) return 'PENDING'
    if (contractors.some(c => c.dcFlagReason)) return 'FLAGGED'
    if (contractors.every(c => c.isVerifiedByDc)) return 'VERIFIED'
    return 'PENDING'
  }, [contractors])

  const moduleFlagReason = useMemo(
    () => contractors.find(c => c.dcFlagReason)?.dcFlagReason ?? null,
    [contractors]
  )

  return (
    <div className="animate-in fade-in duration-500 space-y-4">
      <SectionCard
        title="Service Partners"
        icon={<Briefcase size={18} />}
        action={
          contractors.length > 0
            ? <ModuleStatusBadge status={moduleStatus} />
            : (
              <span className="text-xs font-medium uppercase tracking-label px-3 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10">
                0 Active
              </span>
            )
        }
      >
        {contractors.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <Briefcase size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-2">No active contracts</p>
            <p className="text-xs text-slate-500 max-w-[280px]">No third-party service provider details are registered.</p>
          </div>
        ) : (
          <>
            {/* Contractor list — read-only display, no action buttons per row */}
            <div className="overflow-x-auto -mx-5 -mt-1">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Partner</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Service</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden sm:table-cell">Period</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden md:table-cell">Details</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Value / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contractors.map((c) => {
                    const itemStatus = deriveModuleStatus(c.isVerifiedByDc, c.dcFlagReason)
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-sm text-slate-900">{c.name}</div>
                          {c.gstNumber && (
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                              <Receipt size={10} className="text-slate-400" /> GST: {c.gstNumber}
                            </div>
                          )}
                          {c.dcFlagReason && (
                            <div className="text-xs text-red-600 mt-1">⚑ {c.dcFlagReason}</div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-slate-700 font-semibold">{c.serviceType}</div>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          {c.contractStartDate ? (
                            <div className="text-xs text-slate-600 flex items-center gap-1.5">
                              <Calendar size={10} className="text-slate-400" />
                              {new Date(c.contractStartDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                              {c.contractEndDate && ` → ${new Date(c.contractEndDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          {c.contractReference && (
                            <div className="text-xs text-slate-500 flex items-center gap-1.5">
                              <Hash size={10} className="text-slate-400" /> {c.contractReference}
                            </div>
                          )}
                          {c.paymentStatus && (
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                              <CreditCard size={10} className="text-slate-400" /> {c.paymentStatus}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="font-semibold text-sm text-slate-900">
                              {formatCurrency(c.contractValue as any)}
                            </div>
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
            {/* ONE block for the whole Contractors module. Shown ONLY when PENDING. */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              {moduleStatus === 'PENDING' && (
                <GovernanceActionPanel
                  entityName="Contractors Module"
                  isVerified={false}
                  flagReason={null}
                  canAct={canAct}
                  onVerify={onVerifyContractors}
                  onFlag={onFlagContractors}
                />
              )}
              {moduleStatus === 'VERIFIED' && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 px-5 py-4">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Contractors module verified</p>
                    <p className="text-xs text-emerald-700/70 mt-0.5">All contractor engagements have been audited and approved.</p>
                  </div>
                </div>
              )}
              {moduleStatus === 'FLAGGED' && (
                <div className="rounded-xl border border-red-100 bg-red-50/40 px-5 py-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <Flag size={16} className="text-red-600 shrink-0" />
                    <p className="text-sm font-semibold text-red-800">Contractors module flagged</p>
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
