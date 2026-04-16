import { Clock, Users, Phone, MapPin, Hash, CheckCircle2 } from 'lucide-react'
import { SectionCard } from '../components'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EmployeeSummary } from '@/features/dc/dcTypes'

interface StaffTabProps {
  employees: EmployeeSummary[]
  canAct: boolean
  onVerifyEmployee: (id: number) => void
}

export function StaffTab({ employees, canAct, onVerifyEmployee }: StaffTabProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <SectionCard
        title="Temple Workforce"
        icon={<Users size={18} />}
        action={
          <span className="text-xs font-medium uppercase tracking-label px-3 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10">
            {employees.length} Members
          </span>
        }
      >
        {employees.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <Users size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-2">No workforce records</p>
            <p className="text-xs font-regular text-slate-500 max-w-[280px]">Employee details have not been registered for this temple.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Employee</th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden sm:table-cell">Designation & Type</th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden md:table-cell">Contact & Address</th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden lg:table-cell">Salary & Heritage</th>
                  <th className="px-5 py-4 text-right text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors">{e.fullName || '—'}</div>
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-slate-500 font-regular flex items-center gap-1.5">
                          <Hash size={10} className="text-slate-400" /> {e.employeeRef || 'No Ref ID'}
                        </div>
                        <div className="text-xs text-slate-500 font-regular flex items-center gap-1.5">
                          <Clock size={10} className="text-slate-400" /> Joined {e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Unknown'}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <div className="text-sm text-slate-700 font-semibold">{e.designation || '—'}</div>
                      <div className="mt-2">
                        <span className="text-xs font-medium uppercase tracking-label px-2.5 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {e.employeeType || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="space-y-1.5">
                        {e.mobile && (
                          <div className="text-xs text-slate-600 font-regular flex items-center gap-1.5">
                            <Phone size={11} className="text-slate-400" /> {e.mobile}
                          </div>
                        )}
                        {e.address && (
                          <div className="text-xs text-slate-500 flex items-start gap-1.5 max-w-[200px] leading-tight font-regular">
                            <MapPin size={11} className="text-slate-400 mt-0.5 shrink-0" /> {e.address}
                          </div>
                        )}
                        {!e.mobile && !e.address && <span className="text-xs text-slate-400 italic font-regular">No contact details</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="text-sm text-slate-600 font-semibold">Grade: {e.salaryGrade || '—'}</div>
                      <div className="text-xs text-slate-500 mt-1.5 font-regular">
                        Hereditary: <span className={cn("font-semibold", e.isHereditary ? "text-primary" : "text-slate-700")}>{e.isHereditary ? 'Yes' : 'No'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <span className={cn(
                          "text-xs font-medium uppercase tracking-label px-3 py-1.5 rounded border",
                          e.status === 'ACTIVE'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                          {e.status || '—'}
                        </span>
                        {canAct && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-medium uppercase tracking-button px-3 hover:bg-emerald-50 hover:text-emerald-700 border border-transparent hover:border-emerald-200 transition-all rounded-lg"
                            onClick={() => onVerifyEmployee(e.id)}
                          >
                            <CheckCircle2 size={12} className="mr-1" /> VERIFY
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
