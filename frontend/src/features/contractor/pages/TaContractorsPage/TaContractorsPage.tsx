import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import {
  useListContractorsQuery, useCreateContractorMutation,
  useUpdateContractorMutation, useDeleteContractorMutation,
} from '@/features/contractor/contractorApi'
import {
  createContractorSchema,
  type CreateContractorRequest, type ContractorResponse,
} from '@/features/contractor/contractorTypes'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

type FormMode = 'create' | 'edit' | null

export function TaContractorsPage() {
  const [page, setPage] = useState(0)
  const [mode, setMode] = useState<FormMode>(null)
  const [selectedContractor, setSelectedContractor] = useState<ContractorResponse | null>(null)

  const { data: userData } = useGetCurrentUserQuery()
  const templeId = userData?.data?.templeId

  const { data, isLoading, isError } = useListContractorsQuery(
    { templeId: templeId!, page, size: DEFAULT_PAGE_SIZE },
    { skip: !templeId }
  )

  const [createContractor, { isLoading: creating }] = useCreateContractorMutation()
  const [updateContractor, { isLoading: updating }] = useUpdateContractorMutation()
  const [deleteContractor, { isLoading: deleting }] = useDeleteContractorMutation()

  const contractors = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0

  const form = useForm<CreateContractorRequest>({
    resolver: zodResolver(createContractorSchema),
    defaultValues: { name: '' },
  })

  const openEdit = (c: ContractorResponse) => {
    setSelectedContractor(c)
    form.reset({
      name: c.name,
      gstNumber: c.gstNumber ?? '',
      serviceType: c.serviceType ?? '',
      contractReference: c.contractReference ?? '',
      workOrderDate: c.workOrderDate ?? '',
      contractStartDate: c.contractStartDate ?? '',
      contractEndDate: c.contractEndDate ?? '',
      contractValue: c.contractValue,
      paymentStatus: c.paymentStatus ?? '',
    })
    setMode('edit')
  }

  const closeForm = () => {
    setMode(null)
    setSelectedContractor(null)
    form.reset({ name: '' })
  }

  const onSubmit = async (values: CreateContractorRequest) => {
    if (!templeId) return
    try {
      if (mode === 'edit' && selectedContractor) {
        await updateContractor({ id: selectedContractor.id, body: values }).unwrap()
        toast.success('Contractor updated')
      } else {
        await createContractor({ templeId, body: values }).unwrap()
        toast.success('Contractor added successfully')
      }
      closeForm()
    } catch {
      toast.error(`Failed to ${mode === 'edit' ? 'update' : 'add'} contractor`)
    }
  }

  const onDelete = async (id: number) => {
    try {
      await deleteContractor(id).unwrap()
      toast.success('Contractor removed')
    } catch {
      toast.error('Failed to remove contractor')
    }
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to load contractors"
        description="Unable to fetch contractor data. Please try again."
        action={{ label: 'Retry', onClick: () => window.location.reload() }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contractors</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage contractor and service provider records.</p>
        </div>
        {mode === null && (
          <Button className="bg-gradient-gold shadow-gold" onClick={() => setMode('create')}>
            + Add Contractor
          </Button>
        )}
      </div>

      {/* Form */}
      {mode !== null && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-foreground">
              {mode === 'edit' ? `Edit — ${selectedContractor?.name}` : 'New Contractor'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Contractor Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="gstNumber" render={({ field }) => (
                <FormItem><FormLabel>GST Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="serviceType" render={({ field }) => (
                <FormItem><FormLabel>Service Type</FormLabel><FormControl><Input placeholder="e.g. Construction, Catering" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="contractReference" render={({ field }) => (
                <FormItem><FormLabel>Contract Reference</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="workOrderDate" render={({ field }) => (
                <FormItem><FormLabel>Work Order Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="contractStartDate" render={({ field }) => (
                <FormItem><FormLabel>Contract Start</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="contractEndDate" render={({ field }) => (
                <FormItem><FormLabel>Contract End</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="contractValue" render={({ field }) => (
                <FormItem><FormLabel>Contract Value (₹)</FormLabel>
                  <FormControl><Input type="number" min={0} step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="paymentStatus" render={({ field }) => (
                <FormItem><FormLabel>Payment Status</FormLabel><FormControl><Input placeholder="e.g. PAID, PENDING" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="bg-gradient-gold shadow-gold" disabled={creating || updating}>
                {(creating || updating) ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Add Contractor'}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
        </Form>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div>
      ) : contractors.length === 0 && mode === null ? (
        <EmptyState
          title="No contractors yet"
          description="Add contractor records to track service providers."
          action={{ label: '+ Add Contractor', onClick: () => setMode('create') }}
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Service Type</th>
                <th className="px-4 py-3 text-left font-semibold">Contract Value</th>
                <th className="px-4 py-3 text-left font-semibold">Period</th>
                <th className="px-4 py-3 text-left font-semibold">Payment</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contractors.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.serviceType ?? '—'}</td>
                  <td className="px-4 py-3">{c.contractValue != null ? `₹${c.contractValue.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {c.contractStartDate && c.contractEndDate
                      ? `${c.contractStartDate} → ${c.contractEndDate}`
                      : c.contractStartDate ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.paymentStatus ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Remove</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {c.name}?</AlertDialogTitle>
                            <AlertDialogDescription>This will delete the contractor record.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => onDelete(c.id)} disabled={deleting}>Remove</AlertDialogAction>
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
