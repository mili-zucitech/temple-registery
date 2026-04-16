import { Briefcase, Calendar, Receipt, Hash, CreditCard } from 'lucide-react'
import { SectionCard } from '../components'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '../utils'
import type { ContractorResponse } from '@/features/dc/dcTypes'

interface ContractorsTabProps {
  contractors: ContractorResponse[]
  canAct: boolean
  onVerifyContractor: (id: number) => void
}

export function ContractorsTab({ contractors, canAct, onVerifyContractor }: ContractorsTabProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <SectionCard
        title="Service Partners"
        icon={<Briefcase size={18} />}
        action={
          <span className="text-xs font-medium uppercase tracking-label px-3 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10">
            {contractors.length} Active
          </span>
        }
      >
        {contractors.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <Briefcase size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-2">No active contracts</p>
            <p className="text-xs font-regular text-slate-500 max-w-[280px]">No third-party service provider details are registered.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Partner Entity</th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Provision Type</th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden sm:table-cell">Engagement Period</th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden md:table-cell">Details</th>
                  <th className="px-5 py-4 text-right text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Value & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contractors.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors">{c.name}</div>
                      {c.gstNumber && (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5 font-regular">
                          <Receipt size={11} className="text-slate-400" /> GST: <span className="text-slate-600">{c.gstNumber}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-slate-700 font-semibold">{c.serviceType}</div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-regular">
                          <Calendar size={11} className="text-slate-400" />
                          {c.contractStartDate
                            ? `${new Date(c.contractStartDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} → ${c.contractEndDate ? new Date(c.contractEndDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Unending'}`
                            : '—'}
                        </div>
                        {c.workOrderDate && (
                          <div className="text-xs text-slate-500/80 font-regular ml-4">
                            Work Order: {new Date(c.workOrderDate).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex flex-col gap-1.5">
                        {c.contractReference && (
                          <div className="text-xs text-slate-500 font-regular flex items-center gap-1.5">
                            <Hash size={11} className="text-slate-400" /> {c.contractReference}
                          </div>
                        )}
                        {c.paymentStatus && (
                          <div className="text-xs text-slate-500 font-regular flex items-center gap-1.5">
                            <CreditCard size={11} className="text-slate-400" /> {c.paymentStatus}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <div className="font-semibold text-sm text-slate-900">
                          {formatCurrency(c.contractValue as any)}
                        </div>
                        {canAct && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-medium uppercase tracking-button px-3 border-slate-200 text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all rounded-lg"
                            onClick={() => onVerifyContractor(c.id)}
                          >
                            ACTION
                          </Button>
                        )}
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