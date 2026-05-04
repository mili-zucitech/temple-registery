import { Briefcase, Calendar, Receipt, Hash, Eye, FileText, Download } from 'lucide-react'
import { useState } from 'react'
import { SectionCard } from '../components'
import { formatCurrency } from '../utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ContractorResponse } from '@/features/dc/dcTypes'

interface ContractorsTabProps {
  contractors: ContractorResponse[]
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  CIVIL_WORKS: 'Civil Works',
  ELECTRICAL: 'Electrical',
  SECURITY: 'Security',
  CATERING: 'Catering',
  EVENTS: 'Events',
  OTHER: 'Other',
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
}

const SERVICE_TYPE_COLORS: Record<string, string> = {
  CIVIL_WORKS: 'bg-blue-100 text-blue-800 border-blue-200',
  ELECTRICAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SECURITY: 'bg-red-100 text-red-800 border-red-200',
  CATERING: 'bg-green-100 text-green-800 border-green-200',
  EVENTS: 'bg-purple-100 text-purple-800 border-purple-200',
  OTHER: 'bg-gray-100 text-gray-800 border-gray-200',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  DISPUTED: 'bg-red-100 text-red-800 border-red-200',
}

/**
 * Contractors tab — read-only data view for DC portal.
 *
 * NO approval workflow applies to Contractors.
 * NO verify/flag buttons.
 * NO oversight status block.
 * NO ModuleStatusBadge.
 *
 * Contractor changes are effective immediately on TA save.
 * DC views this as a read-only reference panel.
 */
export function ContractorsTab({ contractors }: ContractorsTabProps) {
  const [page, setPage] = useState(0)
  const [selectedContractor, setSelectedContractor] = useState<ContractorResponse | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  
  const pageSize = 10
  const totalPages = Math.ceil(contractors.length / pageSize)
  const paginatedContractors = contractors.slice(page * pageSize, (page + 1) * pageSize)

  const openDetailDialog = (contractor: ContractorResponse) => {
    setSelectedContractor(contractor)
    setDetailDialogOpen(true)
  }

  const closeDetailDialog = () => {
    setDetailDialogOpen(false)
    setSelectedContractor(null)
  }

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

  return (
    <div className="animate-in fade-in duration-500 space-y-4">
      <SectionCard
        title="Service Partners"
        icon={<Briefcase size={18} />}
        action={
          <span className="text-xs font-medium uppercase tracking-label px-3 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10">
            {contractors.length} {contractors.length === 1 ? 'Active' : 'Active'}
          </span>
        }
      >
        {contractors.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <Briefcase size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-2">No active contracts</p>
            <p className="text-xs text-slate-500 max-w-[280px]">No third-party service provider details are registered.</p>
          </div>
        ) : (
          <>
            {/* Contractor list — read-only display with detail view */}
            <div className="overflow-x-auto -mx-5 -mt-1">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Partner</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Service</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden sm:table-cell">Period</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100 hidden md:table-cell">Payment Status</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Value</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase text-slate-500 tracking-label border-b border-slate-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedContractors.map((c) => {
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-sm text-slate-900">{c.name}</div>
                          {c.gstNumber && (
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                              <Receipt size={10} className="text-slate-400" /> GST: {c.gstNumber}
                            </div>
                          )}
                          {c.dcFlagReason && (
                            <div className="text-xs text-red-600 mt-1">⚑ {c.dcFlagReason}</div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="outline" className={SERVICE_TYPE_COLORS[c.serviceType]}>
                            {SERVICE_TYPE_LABELS[c.serviceType]}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          {c.contractStartDate ? (
                            <div className="text-xs text-slate-600 flex items-center gap-1.5">
                              <Calendar size={10} className="text-slate-400" />
                              {new Date(c.contractStartDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                              {c.contractEndDate && ` → ${new Date(c.contractEndDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <Badge variant="outline" className={PAYMENT_STATUS_COLORS[c.paymentStatus]}>
                            {PAYMENT_STATUS_LABELS[c.paymentStatus]}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="font-semibold text-sm text-slate-900">
                            {formatCurrency(c.contractValue as any)}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailDialog(c)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-slate-600">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}

          </>
        )}
      </SectionCard>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              {selectedContractor?.name}
            </DialogTitle>
            <DialogDescription>Contractor Details</DialogDescription>
          </DialogHeader>

          {selectedContractor && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">
                      Contractor Name
                    </label>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {selectedContractor.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">
                      GST Number
                    </label>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {selectedContractor.gstNumber || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">
                      Service Type
                    </label>
                    <div className="mt-1">
                      <Badge variant="outline" className={SERVICE_TYPE_COLORS[selectedContractor.serviceType]}>
                        {SERVICE_TYPE_LABELS[selectedContractor.serviceType]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">
                      Payment Status
                    </label>
                    <div className="mt-1">
                      <Badge variant="outline" className={PAYMENT_STATUS_COLORS[selectedContractor.paymentStatus]}>
                        {PAYMENT_STATUS_LABELS[selectedContractor.paymentStatus]}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Contract Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      Contract Reference
                    </label>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {selectedContractor.contractReference || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Work Order Date
                    </label>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {selectedContractor.workOrderDate
                        ? new Date(selectedContractor.workOrderDate).toLocaleDateString('en-IN')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Contract Start Date
                    </label>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {selectedContractor.contractStartDate
                        ? new Date(selectedContractor.contractStartDate).toLocaleDateString('en-IN')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Contract End Date
                    </label>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {selectedContractor.contractEndDate
                        ? new Date(selectedContractor.contractEndDate).toLocaleDateString('en-IN')
                        : '—'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <Receipt className="h-3 w-3" />
                      Contract Value
                    </label>
                    <p className="text-lg font-bold text-foreground mt-1">
                      {formatCurrency(selectedContractor.contractValue as any)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contract Documents */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Contract Documents</h3>
                {selectedContractor.documentIds && selectedContractor.documentIds.length > 0 ? (
                  <div className="space-y-2">
                    {selectedContractor.documentIds.map((docId, index) => (
                      <div
                        key={docId}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
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
                  <div className="text-center py-6 border border-dashed border-border rounded-lg">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No documents uploaded</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
