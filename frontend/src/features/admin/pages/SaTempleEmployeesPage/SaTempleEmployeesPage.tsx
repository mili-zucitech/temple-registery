import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@/lib/apiError'
import { ArrowLeft, Info, PlusCircle, Pencil, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROUTE_PATHS } from '@/constants/routePaths'
import {
  useListEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} from '@/features/employee/employeeApi'
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  EMPLOYEE_TYPES,
  EMPLOYEE_STATUSES,
  type CreateEmployeeRequest,
  type UpdateEmployeeRequest,
  type EmployeeResponse,
} from '@/features/employee/employeeTypes'

export function SaTempleEmployeesPage() {
  const { templeId: rawId } = useParams<{ templeId: string }>()
  const navigate = useNavigate()
  const templeId = Number(rawId)

  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeResponse | null>(null)

  const { data, isLoading } = useListEmployeesQuery({ templeId, page, size: 10 }, { skip: !templeId })
  const employees = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 1

  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation()
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation()
  const [deleteEmployee] = useDeleteEmployeeMutation()

  const isSaving = creating || updating

  const form = useForm<CreateEmployeeRequest>({
    resolver: zodResolver(editingEmployee ? updateEmployeeSchema : createEmployeeSchema),
    values: {
      fullName: editingEmployee?.fullName ?? '',
      employeeType: editingEmployee?.employeeType ?? 'PRIEST',
      designation: editingEmployee?.designation ?? '',
      dateOfJoining: editingEmployee?.dateOfJoining ?? '',
      salaryGrade: editingEmployee?.salaryGrade ?? '',
      mobile: editingEmployee?.mobile ?? '',
      address: editingEmployee?.address ?? '',
      isHereditary: editingEmployee?.isHereditary ?? false,
    },
  })

  const openAdd = () => {
    setEditingEmployee(null)
    form.reset({
      fullName: '',
      employeeType: 'PRIEST',
      designation: '',
      dateOfJoining: '',
      salaryGrade: '',
      mobile: '',
      address: '',
      isHereditary: false,
    })
    setDialogOpen(true)
  }

  const openEdit = (emp: EmployeeResponse) => {
    setEditingEmployee(emp)
    setDialogOpen(true)
  }

  const onDelete = async (id: number) => {
    if (!confirm('Delete this employee record?')) return
    try {
      await deleteEmployee(id).unwrap()
      toast.success('Employee deleted.')
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to delete employee.'))
    }
  }

  const onSave = async (values: CreateEmployeeRequest | UpdateEmployeeRequest) => {
    try {
      if (editingEmployee) {
        await updateEmployee({ id: editingEmployee.id, body: values as UpdateEmployeeRequest }).unwrap()
        toast.success('Employee updated.')
      } else {
        await createEmployee({ templeId, body: values as CreateEmployeeRequest }).unwrap()
        toast.success('Employee added.')
      }
      setDialogOpen(false)
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to save employee.'))
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTE_PATHS.DC_TEMPLE_DETAIL.replace(':templeId', String(templeId)) + '?tab=staff')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Temple
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
        <Button size="sm" onClick={openAdd}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <Alert className="border-blue-200 bg-blue-50 text-blue-800">
        <Info className="h-4 w-4" />
        <AlertDescription>
          You are managing employees as <strong>Super Administrator</strong>.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No employees found.</div>
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Designation</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hereditary</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{emp.fullName}</td>
                    <td className="px-4 py-3">{emp.employeeType}</td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.designation ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{emp.isHereditary ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" aria-label="Edit employee" onClick={() => openEdit(emp)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete employee" onClick={() => onDelete(emp.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground self-center">Page {page + 1} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="employeeType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EMPLOYEE_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="designation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="dateOfJoining" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Joining</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="salaryGrade" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Grade</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="mobile" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="isHereditary" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Hereditary employee</FormLabel>
                  <FormMessage />
                </FormItem>
              )} />

              {editingEmployee && (
                <FormField control={form.control} name={"status" as keyof CreateEmployeeRequest} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value as string}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EMPLOYEE_STATUSES.map(s => (
                          <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving…' : editingEmployee ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
