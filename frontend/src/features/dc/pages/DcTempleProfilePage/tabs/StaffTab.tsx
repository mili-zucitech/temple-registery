import { Users, Hash, Shield, Briefcase, Phone, Eye } from 'lucide-react'
import { useState } from 'react'
import { SectionCard } from '../components'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { EmployeeSummary } from '@/features/dc/dcTypes'

interface StaffTabProps {
  employees: EmployeeSummary[]
  onAddEmployee?: () => void
  onEditEmployee?: (employeeId: number) => void
}

const ITEMS_PER_PAGE = 10

/**
 * Staff tab — module-level verification with improved UI and pagination.
 */
export function StaffTab({ employees, onAddEmployee, onEditEmployee }: StaffTabProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null)

  const totalActive = employees.filter((e) => e.status === 'ACTIVE').length

  // Pagination
  const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE)
  const paginatedEmployees = employees.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  )

  const getEmployeeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PRIEST: 'Priest (Archaka)',
      ADMINISTRATIVE: 'Administrative',
      MAINTENANCE: 'Maintenance',
      SECURITY: 'Security',
      OTHER: 'Other',
    }
    return labels[type] || type
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-4">
      <SectionCard
        title="Temple Workforce"
        icon={<Users size={18} />}
        action={
          <div className="flex items-center gap-3">
            {onAddEmployee && (
              <Button variant="outline" size="sm" onClick={onAddEmployee} className="text-xs h-7 px-3">
                Add Employee
              </Button>
            )}
            {employees.length > 0
              ? (
                <>
                  <span className="text-xs font-medium uppercase tracking-label px-3 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10">
                    {employees.length} {employees.length === 1 ? 'Member' : 'Members'}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-label px-3 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    {totalActive} Active
                  </span>
                </>
              )
              : (
                <span className="text-xs font-medium uppercase tracking-label px-3 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10">
                  0 Members
                </span>
              )
            }
          </div>
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
            {/* Employee Table */}
            <div className="overflow-x-auto -mx-5 -mt-1">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Employee ID</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden md:table-cell">Designation</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden lg:table-cell">Mobile</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Status</th>
                    <th className="px-5 py-3 text-center text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEmployees.map((employee) => {
                    return (
                      <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded border border-border">
                            {employee.employeeRef || `EMP-${employee.id}`}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-sm text-slate-900">{employee.fullName}</div>
                          {employee.isHereditary && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200 mt-1">
                              <Shield className="size-2.5" />
                              Hereditary
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-medium uppercase tracking-label px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {getEmployeeTypeLabel(employee.employeeType)}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell text-slate-700">
                          {employee.designation || '—'}
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell text-slate-600 text-xs">
                          {employee.mobile || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            'text-xs font-medium uppercase tracking-label px-2 py-0.5 rounded border inline-block',
                            employee.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : employee.status === 'ON_LEAVE'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          )}>
                            {employee.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEmployee(employee)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="size-4" />
                            </Button>
                            {onEditEmployee && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditEmployee(employee.id)}
                                className="h-8 px-2 text-xs text-primary hover:text-primary"
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 px-5">
                <div className="text-xs text-muted-foreground">
                  Showing {currentPage * ITEMS_PER_PAGE + 1} to {Math.min((currentPage + 1) * ITEMS_PER_PAGE, employees.length)} of {employees.length} employees
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 0} 
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = currentPage < 3 ? i : currentPage - 2 + i
                      if (pageNum >= totalPages) return null
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum + 1}
                        </Button>
                      )
                    })}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage >= totalPages - 1} 
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

          </>
        )}
      </SectionCard>

      {/* Employee Detail Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEmployee && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="size-5 text-primary" />
                  Employee Details
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                {/* Header */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-border">
                  <div className="size-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center border-2 border-white shadow-md">
                    <Users className="size-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{selectedEmployee.fullName}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {getEmployeeTypeLabel(selectedEmployee.employeeType)}
                      {selectedEmployee.designation && ` • ${selectedEmployee.designation}`}
                    </p>
                    {selectedEmployee.employeeRef && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Hash className="size-3 text-muted-foreground" />
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{selectedEmployee.employeeRef}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={cn(
                      'text-xs font-medium uppercase tracking-label px-2 py-1 rounded border',
                      selectedEmployee.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : selectedEmployee.status === 'ON_LEAVE'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    )}>
                      {selectedEmployee.status}
                    </span>
                    {selectedEmployee.isHereditary && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200">
                        <Shield className="size-3" />
                        Hereditary
                      </span>
                    )}
                  </div>
                </div>

                {/* Employment Details */}
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Briefcase className="size-4 text-primary" />
                      Employment Information
                    </CardTitle>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground uppercase tracking-wide mb-1">Employee Type</p>
                        <p className="font-semibold">{getEmployeeTypeLabel(selectedEmployee.employeeType)}</p>
                      </div>
                      {selectedEmployee.designation && (
                        <div>
                          <p className="text-muted-foreground uppercase tracking-wide mb-1">Designation</p>
                          <p className="font-semibold">{selectedEmployee.designation}</p>
                        </div>
                      )}
                      {selectedEmployee.salaryGrade && (
                        <div>
                          <p className="text-muted-foreground uppercase tracking-wide mb-1">Salary Grade</p>
                          <p className="font-semibold">{selectedEmployee.salaryGrade}</p>
                        </div>
                      )}
                      {selectedEmployee.dateOfJoining && (
                        <div>
                          <p className="text-muted-foreground uppercase tracking-wide mb-1">Date of Joining</p>
                          <p className="font-semibold">
                            {new Date(selectedEmployee.dateOfJoining).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground uppercase tracking-wide mb-1">Hereditary Role</p>
                        <p className="font-semibold">{selectedEmployee.isHereditary ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                {(selectedEmployee.mobile || selectedEmployee.address) && (
                  <Card className="border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Phone className="size-4 text-primary" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-3">
                      <div className="space-y-2 text-xs">
                        {selectedEmployee.mobile && (
                          <div>
                            <p className="text-muted-foreground uppercase tracking-wide mb-1">Mobile Number</p>
                            <p className="font-semibold">{selectedEmployee.mobile}</p>
                          </div>
                        )}
                        {selectedEmployee.address && (
                          <div>
                            <p className="text-muted-foreground uppercase tracking-wide mb-1">Address</p>
                            <p className="font-semibold">{selectedEmployee.address}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
