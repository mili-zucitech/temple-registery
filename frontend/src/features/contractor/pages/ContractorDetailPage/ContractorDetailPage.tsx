import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Briefcase, FileText, Calendar, Receipt, Hash, Eye, Download } from 'lucide-react'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { useGetContractorByIdQuery } from '@/features/contractor/contractorApi'
import { SERVICE_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '@/features/contractor/contractorTypes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'

const SERVICE_TYPE_COLORS = {
  CIVIL_WORKS: 'bg-blue-100 text-blue-800 border-blue-200',
  ELECTRICAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SECURITY: 'bg-red-100 text-red-800 border-red-200',
  CATERING: 'bg-green-100 text-green-800 border-green-200',
  EVENTS: 'bg-purple-100 text-purple-800 border-purple-200',
  OTHER: 'bg-gray-100 text-gray-800 border-gray-200',
}

const PAYMENT_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  DISPUTED: 'bg-red-100 text-red-800 border-red-200',
}

export function ContractorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useGetContractorByIdQuery(Number(id), {
    skip: !id,
  })

  const contractor = data?.data

  const handlePreviewDocument = (docId: number) => {
    // Open preview endpoint directly in new tab - uses inline Content-Disposition
    const previewUrl = `/api/v1/documents/${docId}/preview`
    window.open(previewUrl, '_blank')
  }

  const handleDownloadDocument = (docId: number) => {
    // Use download endpoint which forces download with attachment Content-Disposition
    const downloadUrl = `/api/v1/documents/${docId}/download`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `contract-document-${docId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (isError || !contractor) {
    return (
      <EmptyState
        title="Contractor not found"
        description="Unable to load contractor details. Please try again."
        action={{
          label: 'Back to List',
          onClick: () => navigate(ROUTE_PATHS.TA_CONTRACTORS),
        }}
      />
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTE_PATHS.TA_CONTRACTORS)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-8 w-px bg-border" />
          <div>
            <h1 className="text-xl font-bold text-foreground">{contractor.companyName}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Contractor Details</p>
          </div>
        </div>
        <Button
          className="bg-gradient-gold shadow-gold"
          onClick={() => navigate(ROUTE_PATHS.TA_CONTRACTOR_EDIT.replace(':id', id!))}
        >
          Edit Contractor
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Company Name
                </label>
                <p className="text-sm font-medium text-foreground mt-1">{contractor.companyName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  GST Number
                </label>
                <p className="text-sm font-medium text-foreground mt-1">
                  {contractor.gstNumber || '—'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Service Type
                </label>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className={SERVICE_TYPE_COLORS[contractor.serviceType]}
                  >
                    {SERVICE_TYPE_LABELS[contractor.serviceType]}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Payment Status
                </label>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className={PAYMENT_STATUS_COLORS[contractor.paymentStatus]}
                  >
                    {PAYMENT_STATUS_LABELS[contractor.paymentStatus]}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Information */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Contract Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Contract Reference
                </label>
                <p className="text-sm font-medium text-foreground mt-1">
                  {contractor.contractReference || '—'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Work Order Date
                </label>
                <p className="text-sm font-medium text-foreground mt-1">
                  {contractor.workOrderDate
                    ? new Date(contractor.workOrderDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Contract Start Date
                </label>
                <p className="text-sm font-medium text-foreground mt-1">
                  {contractor.contractStartDate
                    ? new Date(contractor.contractStartDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Contract End Date
                </label>
                <p className="text-sm font-medium text-foreground mt-1">
                  {contractor.contractEndDate
                    ? new Date(contractor.contractEndDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Receipt className="h-3 w-3" />
                  Contract Value
                </label>
                <p className="text-lg font-bold text-foreground mt-1">
                  {contractor.contractValue != null
                    ? `₹${contractor.contractValue.toLocaleString('en-IN')}`
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Contract Documents */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Contract Documents
            </h2>
            {contractor.documentIds && contractor.documentIds.length > 0 ? (
              <div className="space-y-2">
                {contractor.documentIds.map((docId, index) => (
                  <div
                    key={docId}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Contract Document {index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">Document ID: {docId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewDocument(docId)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(docId)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No documents uploaded</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Quick Info Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Info</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Contract Period
                </label>
                <p className="text-sm font-medium text-foreground mt-1">
                  {contractor.contractStartDate && contractor.contractEndDate
                    ? `${new Date(contractor.contractStartDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })} → ${new Date(contractor.contractEndDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })}`
                    : '—'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Contract Value
                </label>
                <p className="text-xl font-bold text-primary mt-1">
                  {contractor.contractValue != null
                    ? `₹${contractor.contractValue.toLocaleString('en-IN')}`
                    : '—'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Payment Status
                </label>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className={PAYMENT_STATUS_COLORS[contractor.paymentStatus]}
                  >
                    {PAYMENT_STATUS_LABELS[contractor.paymentStatus]}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
