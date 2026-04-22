import { Users, Clock, Hash, Phone, MapPin } from 'lucide-react'
import { SectionCard } from '../components'
import { cn } from '@/lib/utils'
import type { EmployeeSummary } from '@/features/dc/dcTypes'

interface StaffTabProps {
  employees: EmployeeSummary[]
}

/**
 * Staff tab — read-only data view for DC portal.
 *
 * NO approval workflow applies to Staff.
 * NO verify/flag buttons.
 * NO oversight status block.
 * NO ModuleStatusBadge.
 *
 * Staff changes are effective immediately on TA save.
 * DC views this as a read-only reference panel.
 */
export function StaffTab({ employees }: StaffTabProps) {
  return (
    <div className="animate-in fade-in duration-500 space-y-4">
      <SectionCard
        title="Temple Workforce"
        icon={<Users size={18} />}
        action={
          <span className="text-xs font-medium uppercase tracking-label px-3 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10">
            {employees.length} {employees.length === 1 ? 'Member' : 'Members'}
          </span>
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
                {employees.map((e) => (
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
                      <span className={cn(
                        'text-xs font-medium uppercase tracking-label px-2.5 py-1 rounded border',
                        e.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      )}>
                        {e.status}
                      </span>
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
