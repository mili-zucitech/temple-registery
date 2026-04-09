import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListAllDeclarationsQuery } from '../declarationApi'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { DECLARATION_STATUSES } from '../declarationTypes'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { FileText } from 'lucide-react'

export function DeclarationListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading, isError } = useListAllDeclarationsQuery({
    page,
    size: DEFAULT_PAGE_SIZE,
    status: statusFilter || undefined,
  })

  const declarations = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0
  const totalElements = data?.data?.totalElements ?? 0

  if (isError) {
    return (
      <EmptyState
        title="Failed to load declarations"
        description="Unable to fetch declaration data. Please try again."
        action={{ label: 'Retry', onClick: () => window.location.reload() }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="w-48">
          <label className="text-sm font-medium mb-1 block">Status</label>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0) }}>
            <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {DECLARATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="bg-gradient-gold shadow-gold"
          onClick={() => navigate('/dc/declarations/new')}
        >
          New Declaration
        </Button>
      </div>

      {/* Table */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">{totalElements.toLocaleString()} declaration(s)</p>

        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : declarations.length === 0 ? (
          <EmptyState
            title="No declarations found"
            description="No declarations match the selected filters."
            icon={<FileText size={32} />}
          />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Temple</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                  <th className="px-4 py-3 text-left font-semibold">Due Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {declarations.map((dec) => (
                  <tr key={dec.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">#{dec.id}</td>
                    <td className="px-4 py-3">{dec.templeName ?? `Temple #${dec.templeId}`}</td>
                    <td className="px-4 py-3"><StatusBadge status={dec.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {dec.submittedAt ? new Date(dec.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {dec.dueDate ? new Date(dec.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/dc/declarations/${dec.id}`)}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>Next</Button>
          </div>
        )}
      </div>
    </div>
  )
}
