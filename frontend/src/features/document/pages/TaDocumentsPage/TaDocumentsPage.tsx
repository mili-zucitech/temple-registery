import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@/lib/apiError'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import {
  useListDocumentsQuery, useUploadDocumentMutation,
  useGetDocumentUrlQuery, useSoftDeleteDocumentMutation,
  type DocumentResponse,
} from '@/features/document/documentApi'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { UploadCloud, FileText, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  // VAL-005: 10 MB
const ALLOWED_MIME        = 'application/pdf'  // VAL-004: PDF only

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateFile(file: File): string | null {
  if (file.type !== ALLOWED_MIME) return 'Only PDF files are accepted (VAL-004)'
  if (file.size > MAX_FILE_SIZE_BYTES) return 'File exceeds the 10 MB limit (VAL-005)'
  return null
}

function DocumentDownloadButton({ documentId }: { documentId: number }) {
  const [fetch, setFetch] = useState(false)
  const { data, isFetching } = useGetDocumentUrlQuery(documentId, { skip: !fetch })

  const handleDownload = () => {
    if (data?.data?.url) {
      window.open(data.data.url, '_blank', 'noopener,noreferrer')
      setFetch(false)
    } else {
      setFetch(true)
    }
  }

  if (data?.data?.url && fetch) {
    window.open(data.data.url, '_blank', 'noopener,noreferrer')
    setFetch(false)
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDownload} disabled={isFetching}>
      {isFetching ? 'Loading…' : 'Download'}
    </Button>
  )
}

export function TaDocumentsPage() {
  const [page, setPage] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [labelInput, setLabelInput] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const { data: userData } = useGetCurrentUserQuery()
  const templeId = userData?.data?.templeId
  const isViewOnly = userData?.data?.accessType === 'VIEW'
  const ownerType = 'TEMPLE' as const

  const { data, isLoading, isError, refetch } = useListDocumentsQuery(
    { ownerType, ownerId: templeId!, page, size: DEFAULT_PAGE_SIZE },
    { skip: !templeId }
  )

  const [uploadDocument, { isLoading: uploading }] = useUploadDocumentMutation()
  const [softDeleteDocument, { isLoading: deleting }] = useSoftDeleteDocumentMutation()

  const documents = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0

  const performUpload = useCallback(async (file: File) => {
    if (!templeId) return
    const error = validateFile(file)
    if (error) { toast.error(error); return }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('ownerType', ownerType)
    formData.append('ownerId', String(templeId))
    if (labelInput.trim()) formData.append('documentLabel', labelInput.trim())

    try {
      await uploadDocument(formData).unwrap()
      toast.success(`${file.name} uploaded successfully`)
      setLabelInput('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to upload document'))
    }
  }, [templeId, labelInput, uploadDocument])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) performUpload(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) performUpload(file)
  }

  const handleDelete = async (doc: DocumentResponse) => {
    try {
      await softDeleteDocument(doc.id).unwrap()
      toast.success(`${doc.originalFilename} removed`)
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to remove document'))
    }
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to load documents"
        description="Unable to fetch document data. Please try again."
        action={{ label: 'Retry', onClick: () => refetch() }}
      />
    )
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/5 via-card to-secondary/5 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <FolderOpen size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Documents</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Upload and manage temple documents · PDF only, max 10 MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Zone — drag-and-drop */}
      {!isViewOnly && (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'rounded-lg border-2 border-dashed p-8 transition-all duration-150 text-center',
          dragActive
            ? 'border-primary bg-primary/5 shadow-gold'
            : 'border-border bg-muted/30 hover:border-primary/50',
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
            dragActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
          )}>
            <UploadCloud size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {dragActive ? 'Drop the PDF here' : 'Drag & drop a PDF, or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">PDF only · Maximum 10 MB</p>
          </div>
          {/* Label + upload button row */}
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full max-w-md mt-2">
            <input
              type="text"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Label (optional) e.g. Trust Deed"
              value={labelInput}
              onChange={e => setLabelInput(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
            <Button
              className="bg-gradient-gold shadow-gold flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Browse File'}
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
      )}

      {/* Document List */}
      {isLoading ? (
        <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div>
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents uploaded"
          description="Upload trust deed, PAN card, meeting minutes and other required documents."
          icon={<FileText size={44} />}
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden shadow-soft-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Label
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                      <span
                        className="font-medium max-w-[180px] truncate text-foreground"
                        title={doc.originalFilename}
                      >
                        {doc.originalFilename}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{doc.documentLabel ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatBytes(doc.fileSizeBytes)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <DocumentDownloadButton documentId={doc.id} />
                      {!isViewOnly && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove document?</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{doc.originalFilename}" will be permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground"
                                onClick={() => handleDelete(doc)}
                                disabled={deleting}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <Button
                variant="outline" size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
              <Button
                variant="outline" size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
