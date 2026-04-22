import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft, Briefcase, FileText, Upload, Eye, Download, Trash2 } from 'lucide-react'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import {
  useGetContractorByIdQuery,
  useCreateContractorMutation,
  useUpdateContractorMutation,
} from '@/features/contractor/contractorApi'
import {
  useUploadDocumentMutation,
  useSoftDeleteDocumentMutation,
  useLazyGetDocumentUrlQuery,
} from '@/features/document/documentApi'
import {
  createContractorSchema,
  type CreateContractorRequest,
  ServiceType,
  PaymentStatus,
  SERVICE_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/features/contractor/contractorTypes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'

interface UploadedDocument {
  id: number
  originalFilename: string
  mimeType: string
  fileSizeBytes: number
  createdAt: string
}

export function ContractorFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])

  const { data: userData } = useGetCurrentUserQuery()
  const templeId = userData?.data?.templeId

  const { data: contractorData, isLoading: loadingContractor } = useGetContractorByIdQuery(
    Number(id),
    { skip: !isEditMode || !id }
  )

  const [createContractor, { isLoading: creating }] = useCreateContractorMutation()
  const [updateContractor, { isLoading: updating }] = useUpdateContractorMutation()
  const [uploadDocument, { isLoading: uploading }] = useUploadDocumentMutation()
  const [deleteDocument] = useSoftDeleteDocumentMutation()
  const [getDocumentUrl] = useLazyGetDocumentUrlQuery()

  const form = useForm<CreateContractorRequest>({
    resolver: zodResolver(createContractorSchema),
    defaultValues: {
      companyName: '',
      gstNumber: '',
      serviceType: ServiceType.OTHER,
      contractReference: '',
      workOrderDate: '',
      contractStartDate: '',
      contractEndDate: '',
      contractValue: 0,
      paymentStatus: PaymentStatus.PENDING,
      documentIds: [],
    },
  })

  // Load contractor data in edit mode
  useEffect(() => {
    if (isEditMode && contractorData?.data) {
      const c = contractorData.data
      form.reset({
        companyName: c.companyName,
        gstNumber: c.gstNumber ?? '',
        serviceType: c.serviceType,
        contractReference: c.contractReference ?? '',
        workOrderDate: c.workOrderDate ?? '',
        contractStartDate: c.contractStartDate ?? '',
        contractEndDate: c.contractEndDate ?? '',
        contractValue: c.contractValue ?? 0,
        paymentStatus: c.paymentStatus,
        documentIds: c.documentIds ?? [],
      })
      // Load existing documents
      if (c.documentIds && c.documentIds.length > 0) {
        // Fetch document details for each ID
        c.documentIds.forEach(async (docId) => {
          try {
            const response = await fetch(`/api/documents/${docId}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            })
            if (response.ok) {
              const data = await response.json()
              if (data.success && data.data) {
                setUploadedDocuments((prev) => [...prev, data.data])
              }
            }
          } catch (error) {
            console.error('Failed to fetch document:', error)
          }
        })
      }
    }
  }, [isEditMode, contractorData, form])

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!templeId) {
      toast.error('Temple ID not found')
      return
    }

    const uploadPromises = Array.from(files).map(async (file) => {
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} is not a PDF file`)
        return null
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`)
        return null
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('ownerType', 'CONTRACTOR')
      formData.append('ownerId', templeId.toString())
      formData.append('documentLabel', 'CONTRACT_DOCUMENT')

      try {
        const response = await uploadDocument(formData).unwrap()
        if (response.success && response.data) {
          toast.success(`${file.name} uploaded successfully`)
          return response.data
        }
        return null
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`)
        return null
      }
    })

    const results = await Promise.all(uploadPromises)
    const successfulUploads = results.filter((doc) => doc !== null) as UploadedDocument[]

    if (successfulUploads.length > 0) {
      setUploadedDocuments((prev) => [...prev, ...successfulUploads])
      const currentDocIds = form.getValues('documentIds') || []
      form.setValue('documentIds', [
        ...currentDocIds,
        ...successfulUploads.map((doc) => doc.id),
      ])
    }
  }

  const handleDeleteDocument = async (docId: number) => {
    try {
      await deleteDocument(docId).unwrap()
      setUploadedDocuments((prev) => prev.filter((doc) => doc.id !== docId))
      const currentDocIds = form.getValues('documentIds') || []
      form.setValue(
        'documentIds',
        currentDocIds.filter((id) => id !== docId)
      )
      toast.success('Document deleted successfully')
    } catch (error) {
      toast.error('Failed to delete document')
    }
  }

  const handlePreviewDocument = async (docId: number) => {
    // Open preview endpoint directly in new tab - uses inline Content-Disposition
    const previewUrl = `/api/v1/documents/${docId}/preview`
    window.open(previewUrl, '_blank')
  }

  const handleDownloadDocument = async (docId: number, filename: string) => {
    // Use download endpoint which forces download with attachment Content-Disposition
    const downloadUrl = `/api/v1/documents/${docId}/download`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const onSubmit = async (values: CreateContractorRequest) => {
    if (!templeId) {
      toast.error('Temple ID not found')
      return
    }

    try {
      if (isEditMode && id) {
        await updateContractor({ id: Number(id), body: values }).unwrap()
        toast.success('Contractor updated successfully')
      } else {
        await createContractor({ templeId, body: values }).unwrap()
        toast.success('Contractor added successfully')
      }
      navigate(ROUTE_PATHS.TA_CONTRACTORS)
    } catch (error) {
      toast.error(`Failed to ${isEditMode ? 'update' : 'add'} contractor`)
    }
  }

  if (isEditMode && loadingContractor) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
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
            <h1 className="text-xl font-bold text-foreground">
              {isEditMode ? 'Edit Contractor' : 'Add New Contractor'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEditMode
                ? 'Update contractor information and contract details'
                : 'Enter contractor information and contract details'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gstNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="GST Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Service *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ServiceType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {SERVICE_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(PaymentStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {PAYMENT_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Contract Details */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Contract Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contractReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Reference Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Reference Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workOrderDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Order Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractValue"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Contract Value (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Contract Documents */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Contract Documents
            </h2>

            {/* Upload Area */}
            <div className="mb-6">
              <label
                htmlFor="document-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">Click to upload</span> or drag
                    and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF files only (MAX. 10MB per file)
                  </p>
                </div>
                <input
                  id="document-upload"
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Uploaded Documents List */}
            {uploadedDocuments.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Uploaded Documents ({uploadedDocuments.length})
                </h3>
                {uploadedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {doc.originalFilename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.fileSizeBytes / 1024).toFixed(2)} KB •{' '}
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreviewDocument(doc.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc.id, doc.originalFilename)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-border rounded-lg">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload contract documents using the area above
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ROUTE_PATHS.TA_CONTRACTORS)}
              disabled={creating || updating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-gold shadow-gold"
              disabled={creating || updating}
            >
              {creating || updating
                ? 'Saving...'
                : isEditMode
                ? 'Save Changes'
                : 'Add Contractor'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
