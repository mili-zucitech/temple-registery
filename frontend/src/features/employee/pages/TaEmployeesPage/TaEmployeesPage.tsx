import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import {
  useListEmployeesQuery, useCreateEmployeeMutation,
  useUpdateEmployeeMutation, useDeleteEmployeeMutation,
} from '@/features/employee/employeeApi'
import {
  createEmployeeSchema, updateEmployeeSchema,
  EMPLOYEE_TYPES, EMPLOYEE_STATUSES, TERMINAL_EMPLOYEE_STATUSES,
  type CreateEmployeeRequest, type UpdateEmployeeRequest, type EmployeeResponse,
} from '@/features/employee/employeeTypes'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

type FormMode = 'create' | 'edit' | null

export function TaEmployeesPage() {
  const [page, setPage] = useState(0)
  const [mode, setMode] = useState<FormMode>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResponse | null>(null)

  const { data: userData } = useGetCurrentUserQuery()
  const templeId = userData?.data?.templeId

  const { data, isLoading, isError } = useListEmployeesQuery(
    { templeId: templeId!, page, size: DEFAULT_PAGE_SIZE },
    { skip: !templeId }
  )

  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation()
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation()
  const [deleteEmployee, { isLoading: deleting }] = useDeleteEmployeeMutation()

  const employees = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0

  const createForm = useForm<CreateEmployeeRequest>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: { fullName: '', isHereditary: false },
  })

  const updateForm = useForm<UpdateEmployeeRequest>({
    resolver: zodResolver(updateEmployeeSchema),
  })

  const openEdit = (emp: EmployeeResponse) => {
    setSelectedEmployee(emp)
    updateForm.reset({
      fullName: emp.fullName,
      employeeType: emp.employeeType,
      designation: emp.designation ?? '',
      salaryGrade: emp.salaryGrade ?? '',
      status: emp.status,
    })
    setMode('edit')
  }

  const closeForm = () => {
    setMode(null)
    setSelectedEmployee(null)
    createForm.reset()
    updateForm.reset()
  }

  const onCreateSubmit = async (values: CreateEmployeeRequest) => {
    if (!templeId) return
    try {
      await createEmployee({ templeId, body: values }).unwrap()
      toast.success('Employee added successfully')
      closeForm()
    } catch {
      toast.error('Failed to add employee')
    }
  }

  const onUpdateSubmit = async (values: UpdateEmployeeRequest) => {
    if (!selectedEmployee) return
    try {
      await updateEmployee({ id: selectedEmployee.id, body: values }).unwrap()
      toast.success('Employee updated')
      closeForm()
    } catch {
      toast.error('Failed to update employee')
    }
  }

  const onDelete = async (id: number) => {
    try {
      await deleteEmployee(id).unwrap()
      toast.success('Employee removed')
    } catch {
      toast.error('Failed to remove employee')
    }
  }

  const watchedStatus = updateForm.watch('status')

  if (isError) {
    return (
      <EmptyState
        title="Failed to load employees"
        description="Unable to fetch employee data. Please try again."
        action={{ label: 'Retry', onClick: () => window.location.reload() }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage temple employee records.</p>
        </div>
        {mode === null && (
          <Button className="bg-gradient-gold shadow-gold" onClick={() => setMode('create')}>
            + Add Employee
          </Button>
        )}
      </div>

      {/* Create Form */}
      {mode === 'create' && (
        <Form {...createForm}>
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-foreground">New Employee</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={createForm.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="employeeType" render={({ field }) => (
                <FormItem><FormLabel>Employee Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {EMPLOYEE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="designation" render={({ field }) => (
                <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="salaryGrade" render={({ field }) => (
                <FormItem><FormLabel>Salary Grade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="dateOfJoining" render={({ field }) => (
                <FormItem><FormLabel>Date of Joining</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="mobile" render={({ field }) => (
                <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="isHereditary" render={({ field }) => (
                <FormItem className="flex items-center gap-3"><FormLabel>Hereditary Role</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="bg-gradient-gold shadow-gold" disabled={creating}>{creating ? 'Adding…' : 'Add Employee'}</Button>
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
        </Form>
      )}

      {/* Edit Form */}
      {mode === 'edit' && selectedEmployee && (
        <Form {...updateForm}>
          <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Edit Employee — {selectedEmployee.fullName}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={updateForm.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={updateForm.control} name="employeeType" render={({ field }) => (
                <FormItem><FormLabel>Employee Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {EMPLOYEE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={updateForm.control} name="designation" render={({ field }) => (
                <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={updateForm.control} name="salaryGrade" render={({ field }) => (
                <FormItem><FormLabel>Salary Grade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={updateForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {EMPLOYEE_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              {watchedStatus && TERMINAL_EMPLOYEE_STATUSES.includes(watchedStatus as typeof TERMINAL_EMPLOYEE_STATUSES[number]) && (
                <FormField control={updateForm.control} name="dateOfLeaving" render={({ field }) => (
                  <FormItem><FormLabel>Date of Leaving *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              )}
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="bg-gradient-gold shadow-gold" disabled={updating}>{updating ? 'Saving…' : 'Save Changes'}</Button>
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
        </Form>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div>
      ) : employees.length === 0 && mode === null ? (
        <EmptyState
          title="No employees yet"
          description="Add your first employee record."
          action={{ label: '+ Add Employee', onClick: () => setMode('create') }}
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Designation</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {emp.fullName}
                    {emp.isHereditary && <span className="ml-1 text-xs text-muted-foreground">(Hereditary)</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.employeeType.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.designation ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{emp.dateOfJoining ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(emp)}>Edit</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Remove</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {emp.fullName}?</AlertDialogTitle>
                            <AlertDialogDescription>This action marks the employee record as deleted. It cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => onDelete(emp.id)} disabled={deleting}>Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
