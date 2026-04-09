import { useState } from 'react'
import { useListAuditEventsQuery, type AuditEventResponse } from '../../adminApi'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { Shield } from 'lucide-react'

export function AuditLogPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, isError } = useListAuditEventsQuery({ page, size: DEFAULT_PAGE_SIZE })

  const events = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0
  const totalElements = data?.data?.totalElements ?? 0

  if (isError) {
    return <EmptyState title="Failed to load audit log" action={{ label: 'Retry', onClick: () => window.location.reload() }} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-1 block">Search actor or action</label>
          <Input placeholder="Search…" disabled />
        </div>
        <p className="text-sm text-muted-foreground">{totalElements.toLocaleString()} events</p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : events.length === 0 ? (
        <EmptyState title="No audit events" icon={<Shield size={32} />} />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Time</th>
                <th className="px-4 py-3 text-left font-semibold">Actor</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
                <th className="px-4 py-3 text-left font-semibold">Entity</th>
                <th className="px-4 py-3 text-left font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((event: AuditEventResponse) => (
                <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(event.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium">{event.actorUsername}</td>
                  <td className="px-4 py-3 font-mono text-xs">{event.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.entityType} #{event.entityId}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{event.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>Next</Button>
        </div>
      )}
    </div>
  )
}
