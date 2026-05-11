import { FileText, Shield, Users, TrendingUp, Clipboard, Building2, Download, Clock } from 'lucide-react'
import { SectionCard } from '../components'
import { useListDocumentsQuery, useLazyGetDocumentUrlQuery } from '@/features/document/documentApi'
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@/lib/apiError'

interface DocumentsTabProps {
  templeId: number
}

export function DocumentsTab({ templeId }: DocumentsTabProps) {
  const { data: response, isLoading, isError } = useListDocumentsQuery({
    ownerType: 'TEMPLE',
    ownerId: templeId,
    size: 50
  })

  const documents = response?.data?.content ?? []

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <SectionCard title="Verification Documents" icon={<FileText size={18} />} className="shadow-sm border-slate-200">
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
            <FileText size={32} className="text-red-300" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-2">Unable to load documents</p>
          <p className="text-xs font-regular text-slate-500 max-w-[280px]">There was an error fetching the documents. Please refresh the page and try again.</p>
        </div>
      </SectionCard>
    )
  }

  const categories = [
    { label: 'Registration Certificate', icon: <FileText size={18} />,   type: 'REGISTRATION_CERT' },
    { label: 'Trust Registration',       icon: <Shield size={18} />,     type: 'TRUST_DEED' },
    { label: 'Board Meeting Minutes',    icon: <Users size={18} />,      type: 'MEETING_MINUTES' },
    { label: 'Annual Audit Reports',     icon: <TrendingUp size={18} />, type: 'AUDIT_REPORT' },
    { label: 'Asset Proofs',             icon: <Clipboard size={18} />,  type: 'ASSET_PROOF' },
    { label: 'Temple Photographs',      icon: <Building2 size={18} />,  type: 'PHOTO' },
  ]

  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      <SectionCard title="Verification Documents" icon={<FileText size={18} />} className="shadow-sm border-slate-200">
        {documents.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <FileText size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-2">No documents uploaded</p>
            <p className="text-xs font-regular text-slate-500 max-w-[280px]">The temple authority has not provided any digital verification records.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => {
              const catDocs = documents.filter(d => d.documentLabel === cat.type)
              return (
                <div key={cat.label} className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-4 hover:border-primary/30 transition-all duration-200 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="size-11 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-tight uppercase tracking-section">{cat.label}</p>
                      <p className="text-xs font-regular text-slate-500 mt-1">
                        {catDocs.length} document{catDocs.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {catDocs.length === 0 && (
                      <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-400 uppercase tracking-label">
                        None
                      </span>
                    )}
                  </div>

                  {catDocs.length > 0 && (
                    <div className="space-y-2 mt-1 pt-4 border-t border-slate-100">
                      {catDocs.map(doc => (
                        <DocumentItem key={doc.id} doc={doc} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Other documents not in categories */}
        {documents.filter(d => !categories.some(c => c.type === d.documentLabel)).length > 0 && (
          <div className="mt-10 pt-8 border-t border-slate-100">
             <h3 className="text-xs font-medium text-slate-400 uppercase tracking-label mb-5">Additional Verification Records</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
               {documents.filter(d => !categories.some(c => c.type === d.documentLabel)).map(doc => (
                 <div key={doc.id} className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-3 hover:border-primary/30 transition-all duration-200 shadow-sm">
                   <DocumentItem doc={doc} showLabel />
                 </div>
               ))}
             </div>
          </div>
        )}

        <p className="text-xs font-regular text-slate-400 text-center mt-10 border-t border-slate-100 pt-6 italic">
          Source: Official Temple Authority Submissions. All digital records are integrity-verified.
        </p>
      </SectionCard>
    </div>
  )
}

function DocumentItem({ doc, showLabel = false }: { doc: any, showLabel?: boolean }) {
  const [trigger, { isLoading: isUrlLoading }] = useLazyGetDocumentUrlQuery()

  const handleDownload = async () => {
    try {
      const result = await trigger(doc.id).unwrap()
      if (result?.data?.url) {
        window.open(result.data.url, '_blank')
      } else {
        toast.error('Could not retrieve download URL.')
      }
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to get document URL.'))
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 group/item">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate group-hover/item:text-primary transition-colors">
          {doc.originalFilename}
        </p>
        <div className="flex items-center gap-2 text-xs font-regular text-muted-foreground">
          <span>{(doc.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Clock size={8} /> {new Date(doc.createdAt).toLocaleDateString()}</span>
          {showLabel && doc.documentLabel && (
            <>
              <span>•</span>
              <span className="uppercase font-medium text-primary/70 tracking-label">{doc.documentLabel}</span>
            </>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary shrink-0 transition-all"
        onClick={handleDownload}
        disabled={isUrlLoading}
        title="Download"
      >
        <Download size={14} />
      </Button>
    </div>
  )
}