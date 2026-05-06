import { useState } from 'react'
import {
  useListAuditEventsQuery, useListAuthEventsQuery,
  type AuditEventResponse, type AuthEventResponse
} from '../../adminApi'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { Shield, Lock } from 'lucide-react'

export function AuditLogPage() {
  const [activeTab, setActiveTab] = useState<'mutation' | 'auth'>('mutation')
  const [page, setPage] = useState(0)

  const mutationQuery = useListAuditEventsQuery({ page, size: DEFAULT_PAGE_SIZE }, { skip: activeTab !== 'mutation' })
  const authQuery = useListAuthEventsQuery({ page, size: DEFAULT_PAGE_SIZE }, { skip: activeTab !== 'auth' })

  const isLoading = activeTab === 'mutation' ? mutationQuery.isLoading : authQuery.isLoading
  const refetch = activeTab === 'mutation' ? mutationQuery.refetch : authQuery.refetch
  const isError = activeTab === 'mutation' ? mutationQuery.isError : authQuery.isError
  const data = activeTab === 'mutation' ? mutationQuery.data : authQuery.data

  const events = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0
  const totalElements = data?.data?.totalElements ?? 0

  if (isError) {
    return <EmptyState title="Failed to load audit log" action={{ label: 'Retry', onClick: () => refetch() }} />
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setPage(0) }}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="mutation" className="gap-2">
              <Shield size={14} /> Data Mutation
            </TabsTrigger>
            <TabsTrigger value="auth" className="gap-2">
              <Lock size={14} /> Authentication
            </TabsTrigger>
          </TabsList>
          <p className="text-sm text-muted-foreground">{totalElements.toLocaleString()} events</p>
        </div>

        <TabsContent value="mutation" className="mt-0">
          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : events.length === 0 ? (
            <EmptyState title="No audit events" icon={<Shield size={32} />} />
          ) : (
            <div className="rounded-lg border border-border overflow-hidden bg-card">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Actor</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">Entity</th>
                    <th className="px-4 py-3 font-semibold">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {events.map((event: any) => (
                    <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(event.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium">{event.actorUsername}</td>
                      <td className="px-4 py-3 font-mono text-xs text-primary">{event.action}</td>
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
        </TabsContent>

        <TabsContent value="auth" className="mt-0">
          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : events.length === 0 ? (
            <EmptyState title="No authentication events" icon={<Lock size={32} />} />
          ) : (
            <div className="rounded-lg border border-border overflow-hidden bg-card">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Event</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {events.map((event: any) => (
                    <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(event.occurredAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium">{event.username}</td>
                      <td className="px-4 py-3 font-mono text-xs">{event.eventType}</td>
                      <td className="px-4 py-3">
                        <span className={event.status === 'SUCCESS' ? 'text-success font-medium' : 'text-destructive font-medium'}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{event.ipAddress ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
