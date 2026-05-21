import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Info, PlusCircle, FileText } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { useListDeclarationsQuery } from '@/features/declaration/declarationApi'
import { DeclarationStatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'

export function SaTempleDeclarationsPage() {
  const { templeId: rawId } = useParams<{ templeId: string }>()
  const navigate = useNavigate()
  const templeId = Number(rawId)
  const [page, setPage] = useState(0)

  const { data, isLoading } = useListDeclarationsQuery({ templeId, page, size: 10 }, { skip: !templeId, refetchOnMountOrArgChange: true })
  const declarations = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 1

  const goToCreate = () => {
    navigate(`${ROUTE_PATHS.ADMIN_TEMPLE_DECLARATION_NEW.replace(':templeId', String(templeId))}`)
  }

  const goToEdit = (declarationId: number) => {
    navigate(`${ROUTE_PATHS.ADMIN_TEMPLE_DECLARATION_NEW.replace(':templeId', String(templeId))}?id=${declarationId}`)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTE_PATHS.DC_TEMPLE_DETAIL.replace(':templeId', String(templeId)) + '?tab=declarations')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Temple
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Declarations</h1>
        <Button size="sm" onClick={goToCreate}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Declaration
        </Button>
      </div>

      <Alert className="border-blue-200 bg-blue-50 text-blue-800">
        <Info className="h-4 w-4" />
        <AlertDescription>
          You are managing declarations as <strong>Super Administrator</strong>.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : declarations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No declarations found.</div>
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Financial Year</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Version</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted At</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {declarations.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{d.financialYear ?? '—'}</td>
                    <td className="px-4 py-3">v{d.versionNumber ?? 1}</td>
                    <td className="px-4 py-3">
                      <DeclarationStatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-3">
                      {d.submittedAt ? new Date(d.submittedAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => goToEdit(d.id)}>
                        <FileText className="h-4 w-4 mr-1" />
                        View / Edit
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
    </div>
  )
}
