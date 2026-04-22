import { Briefcase, Calendar, Receipt, Hash, CreditCard } from 'lucide-react'
import { SectionCard } from '../components'
import { formatCurrency } from '../utils'
import type { ContractorResponse } from '@/features/dc/dcTypes'

interface ContractorsTabProps {
  contractors: ContractorResponse[]
}

/**
 * Contractors tab — read-only data view for DC portal.
 *
 * NO approval workflow applies to Contractors.
 * NO verify/flag buttons.
 * NO oversight status block.
 * NO ModuleStatusBadge.
 *
 * Contractor changes are effective immediately on TA save.
 * DC views this as a read-only reference panel.
 */
export function ContractorsTab({ contractors }: ContractorsTabProps) {
  return (
    <div className="animate-in fade-in duration-500 space-y-4">
      <SectionCard
        title="Service Partners"
        icon={<Briefcase size={18} />}
        action={
          <span className="text-xs font-medium uppercase tracking-label px-3 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10">
            {contractors.length} {contractors.length === 1 ? 'Active' : 'Active'}
          </span>
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
          <div className="overflow-x-auto -mx-5 -mt-1">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Partner</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Service</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden sm:table-cell">Period</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden md:table-cell">Details</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contractors.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-sm text-slate-900">{c.name}</div>
                      {c.gstNumber && (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <Receipt size={10} className="text-slate-400" /> GST: {c.gstNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-slate-700 font-semibold">{c.serviceType || '—'}</div>
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
                      <div className="font-semibold text-sm text-slate-900">
                        {formatCurrency(c.contractValue as any)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
