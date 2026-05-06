import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Briefcase, Plus, Eye, Pencil, Trash2, Filter } from 'lucide-react'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import {
  useListContractorsQuery,
  useDeleteContractorMutation,
} from '@/features/contractor/contractorApi'
import {
  type ContractorResponse,
  ServiceType,
  PaymentStatus,
  SERVICE_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/features/contractor/contractorTypes'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { Card, CardContent } from '@/components/ui/card'

const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  [ServiceType.CIVIL_WORKS]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ServiceType.ELECTRICAL]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ServiceType.SECURITY]: 'bg-red-100 text-red-800 border-red-200',
  [ServiceType.CATERING]: 'bg-green-100 text-green-800 border-green-200',
  [ServiceType.EVENTS]: 'bg-purple-100 text-purple-800 border-purple-200',
  [ServiceType.OTHER]: 'bg-gray-100 text-gray-800 border-gray-200',
}

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [PaymentStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
  [PaymentStatus.DISPUTED]: 'bg-red-100 text-red-800 border-red-200',
}

export function TaContractorsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedContractor, setSelectedContractor] = useState<ContractorResponse | null>(null)
  const [filterServiceType, setFilterServiceType] = useState<ServiceType | 'ALL'>('ALL')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<PaymentStatus | 'ALL'>('ALL')

  const { data: userData } = useGetCurrentUserQuery()
  const templeId = userData?.data?.templeId

  const { data, isLoading, isError, refetch } = useListContractorsQuery(
    { templeId: templeId!, page, size: DEFAULT_PAGE_SIZE },
    { skip: !templeId }
  )

  const [deleteContractor, { isLoading: deleting }] = useDeleteContractorMutation()

  const contractors = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0
  const totalElements = data?.data?.totalElements ?? 0

  // Apply filters
  const filteredContractors = contractors.filter((c) => {
    if (filterServiceType !== 'ALL' && c.serviceType !== filterServiceType) return false
    if (filterPaymentStatus !== 'ALL' && c.paymentStatus !== filterPaymentStatus) return false
    return true
  })

  const openDeleteDialog = (c: ContractorResponse) => {
    setSelectedContractor(c)
    setDeleteDialogOpen(true)
  }

  const onDelete = async () => {
    if (!selectedContractor) return
    try {
      await deleteContractor(selectedContractor.id).unwrap()
      toast.success('Contractor deleted successfully')
      setDeleteDialogOpen(false)
      setSelectedContractor(null)
    } catch {
      toast.error('Failed to delete contractor')
    }
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to load contractors"
        description="Unable to fetch contractor data. Please try again."
        action={{ label: 'Retry', onClick: () => refetch() }}
      />
    )
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/5 via-card to-secondary/5 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Briefcase size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contractors</h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Manage contractor and service provider records · {totalElements} total
                </p>
              </div>
            </div>
            <Button
              className="bg-gradient-gold shadow-gold"
              onClick={() => navigate(ROUTE_PATHS.TA_CONTRACTOR_NEW)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contractor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Service Type:</span>
          <Select
            value={filterServiceType}
            onValueChange={(value) => setFilterServiceType(value as ServiceType | 'ALL')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {Object.values(ServiceType).map((type) => (
                <SelectItem key={type} value={type}>
                  {SERVICE_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Payment Status:</span>
          <Select
            value={filterPaymentStatus}
            onValueChange={(value) => setFilterPaymentStatus(value as PaymentStatus | 'ALL')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {Object.values(PaymentStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {PAYMENT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredContractors.length === 0 ? (
        <EmptyState
          title="No contractors found"
          description={
            contractors.length === 0
              ? 'Add contractor records to track service providers.'
              : 'No contractors match the selected filters.'
          }
          action={
            contractors.length === 0
              ? { label: '+ Add Contractor', onClick: () => navigate(ROUTE_PATHS.TA_CONTRACTOR_NEW) }
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Contractor</th>
                <th className="px-4 py-3 text-left font-semibold">Service Type</th>
                <th className="px-4 py-3 text-left font-semibold">Contract Value</th>
                <th className="px-4 py-3 text-left font-semibold">Period</th>
                <th className="px-4 py-3 text-left font-semibold">Payment Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredContractors.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.companyName}</div>
                    {c.gstNumber && (
                      <div className="text-xs text-muted-foreground">GST: {c.gstNumber}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={SERVICE_TYPE_COLORS[c.serviceType]}
                    >
                      {SERVICE_TYPE_LABELS[c.serviceType]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {c.contractValue != null
                      ? `₹${c.contractValue.toLocaleString('en-IN')}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {c.contractStartDate && c.contractEndDate
                      ? `${c.contractStartDate} → ${c.contractEndDate}`
                      : c.contractStartDate ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={PAYMENT_STATUS_COLORS[c.paymentStatus]}
                    >
                      {PAYMENT_STATUS_LABELS[c.paymentStatus]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(ROUTE_PATHS.TA_CONTRACTOR_DETAIL.replace(':id', c.id.toString()))}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(ROUTE_PATHS.TA_CONTRACTOR_EDIT.replace(':id', c.id.toString()))}
                        title="Edit contractor"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => openDeleteDialog(c)}
                        title="Delete contractor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={page === i ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setPage(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contractor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedContractor?.companyName}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedContractor(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
