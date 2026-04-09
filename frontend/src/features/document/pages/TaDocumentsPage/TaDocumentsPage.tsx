import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import {
  useListDocumentsQuery, useUploadDocumentMutation,
  useGetDocumentUrlQuery, useSoftDeleteDocumentMutation,
  type DocumentResponse,
} from '@/features/document/documentApi'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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

  const { data: userData } = useGetCurrentUserQuery()
  const templeId = userData?.data?.templeId

  const { data, isLoading, isError } = useListDocumentsQuery(
    { ownerType: 'TEMPLE', ownerId: templeId!, page, size: DEFAULT_PAGE_SIZE },
    { skip: !templeId }
  )

  const [uploadDocument, { isLoading: uploading }] = useUploadDocumentMutation()
  const [softDeleteDocument, { isLoading: deleting }] = useSoftDeleteDocumentMutation()

  const documents = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !templeId) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('ownerType', 'TEMPLE')
    formData.append('ownerId', String(templeId))
    if (labelInput.trim()) formData.append('documentLabel', labelInput.trim())

    try {
      await uploadDocument(formData).unwrap()
      toast.success(`${file.name} uploaded successfully`)
      setLabelInput('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      toast.error('Failed to upload document')
    }
  }

  const handleDelete = async (doc: DocumentResponse) => {
    try {
      await softDeleteDocument(doc.id).unwrap()
      toast.success(`${doc.originalFilename} removed`)
    } catch {
      toast.error('Failed to remove document')
    }
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to load documents"
        description="Unable to fetch document data. Please try again."
        action={{ label: 'Retry', onClick: () => window.location.reload() }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and manage temple documents.</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1">Document Label (optional)</label>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Trust Deed, PAN Card"
              value={labelInput}
              onChange={e => setLabelInput(e.target.value)}
            />
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <Button
              className="bg-gradient-gold shadow-gold"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Upload Document'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Supported: PDF, JPG, PNG, DOC, DOCX</p>
      </div>

      {/* Document List */}
      {isLoading ? (
        <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div>
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents uploaded"
          description="Upload trust deed, PAN card, and other required documents."
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">File Name</th>
                <th className="px-4 py-3 text-left font-semibold">Label</th>
                <th className="px-4 py-3 text-left font-semibold">Size</th>
                <th className="px-4 py-3 text-left font-semibold">Uploaded</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate" title={doc.originalFilename}>
                    {doc.originalFilename}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{doc.documentLabel ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatBytes(doc.fileSizeBytes)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <DocumentDownloadButton documentId={doc.id} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Remove</Button>
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
