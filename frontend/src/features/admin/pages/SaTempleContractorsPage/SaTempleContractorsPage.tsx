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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROUTE_PATHS } from '@/constants/routePaths'
import {
  useListContractorsQuery,
  useCreateContractorMutation,
  useUpdateContractorMutation,
  useDeleteContractorMutation,
} from '@/features/contractor/contractorApi'
import {
  createContractorSchema,
  updateContractorSchema,
  ServiceType,
  PaymentStatus,
  SERVICE_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  type CreateContractorRequest,
  type UpdateContractorRequest,
  type ContractorResponse,
} from '@/features/contractor/contractorTypes'

export function SaTempleContractorsPage() {
  const { templeId: rawId } = useParams<{ templeId: string }>()
  const navigate = useNavigate()
  const templeId = Number(rawId)

  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContractor, setEditingContractor] = useState<ContractorResponse | null>(null)

  const { data, isLoading } = useListContractorsQuery({ templeId, page, size: 10 }, { skip: !templeId })
  const contractors = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 1

  const [createContractor, { isLoading: creating }] = useCreateContractorMutation()
  const [updateContractor, { isLoading: updating }] = useUpdateContractorMutation()
  const [deleteContractor] = useDeleteContractorMutation()

  const isSaving = creating || updating

  const form = useForm<CreateContractorRequest>({
    resolver: zodResolver(editingContractor ? updateContractorSchema : createContractorSchema),
    values: {
      companyName: editingContractor?.companyName ?? '',
      gstNumber: editingContractor?.gstNumber ?? '',
      serviceType: editingContractor?.serviceType ?? ServiceType.OTHER,
      contractReference: editingContractor?.contractReference ?? '',
      workOrderDate: editingContractor?.workOrderDate ?? '',
      contractStartDate: editingContractor?.contractStartDate ?? '',
      contractEndDate: editingContractor?.contractEndDate ?? '',
      contractValue: editingContractor?.contractValue ?? 0.01,
      paymentStatus: editingContractor?.paymentStatus ?? PaymentStatus.PENDING,
    },
  })

  const openAdd = () => {
    setEditingContractor(null)
    form.reset({
      companyName: '',
      gstNumber: '',
      serviceType: ServiceType.OTHER,
      contractReference: '',
      workOrderDate: '',
      contractStartDate: '',
      contractEndDate: '',
      contractValue: 0.01,
      paymentStatus: PaymentStatus.PENDING,
    })
    setDialogOpen(true)
  }

  const openEdit = (c: ContractorResponse) => {
    setEditingContractor(c)
    setDialogOpen(true)
  }

  const onDelete = async (id: number) => {
    if (!confirm('Delete this contractor record?')) return
    try {
      await deleteContractor(id).unwrap()
      toast.success('Contractor deleted.')
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to delete contractor.'))
    }
  }

  const onSave = async (values: CreateContractorRequest | UpdateContractorRequest) => {
    try {
      if (editingContractor) {
        await updateContractor({ id: editingContractor.id, body: values as UpdateContractorRequest }).unwrap()
        toast.success('Contractor updated.')
      } else {
        await createContractor({ templeId, body: values as CreateContractorRequest }).unwrap()
        toast.success('Contractor added.')
      }
      setDialogOpen(false)
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to save contractor.'))
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTE_PATHS.DC_TEMPLE_DETAIL.replace(':templeId', String(templeId)) + '?tab=contractors')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Temple
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Contractors</h1>
        <Button size="sm" onClick={openAdd}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Contractor
        </Button>
      </div>

      <Alert className="border-blue-200 bg-blue-50 text-blue-800">
        <Info className="h-4 w-4" />
        <AlertDescription>
          You are managing contractors as <strong>Super Administrator</strong>.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : contractors.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No contractors found.</div>
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contract Ref</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Value (₹)</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contractors.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{c.companyName}</td>
                    <td className="px-4 py-3">{SERVICE_TYPE_LABELS[c.serviceType]}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.contractReference ?? '—'}</td>
                    <td className="px-4 py-3">{c.contractValue?.toLocaleString('en-IN') ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.paymentStatus === 'COMPLETED' ? 'default' : 'secondary'}>
                        {PAYMENT_STATUS_LABELS[c.paymentStatus]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" aria-label="Edit contractor" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete contractor" onClick={() => onDelete(c.id)}>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContractor ? 'Edit Contractor' : 'Add Contractor'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
              <FormField control={form.control} name="companyName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="serviceType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ServiceType).map(s => (
                          <SelectItem key={s} value={s}>{SERVICE_TYPE_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="paymentStatus" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(PaymentStatus).map(s => (
                          <SelectItem key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="contractReference" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Reference</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="gstNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="contractStartDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="contractEndDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="workOrderDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Order Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="contractValue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Value (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving…' : editingContractor ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
