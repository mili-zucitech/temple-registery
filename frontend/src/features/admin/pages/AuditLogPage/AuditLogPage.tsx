import { Fragment, useMemo, useState } from 'react'
import {
  useListAuditEventsQuery, useListAuthEventsQuery, useListGovernanceHistoryQuery,
  type AuditEventResponse, type AuthEventResponse, type GovernanceHistoryResponse
} from '../../adminApi'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import {
  Shield, Lock, Download, Search, History, Calendar,
  ChevronDown, ChevronRight, User, AlertTriangle, CheckCircle, XCircle, FileText, Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

function formatDate(raw?: string | null): string {
  if (!raw) return '—'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CREATE_DRAFT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
  UPDATE_DRAFT: 'bg-blue-100 text-blue-800 border-blue-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
  SUBMIT: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECT: 'bg-red-100 text-red-800 border-red-200',
  FLAG: 'bg-orange-100 text-orange-800 border-orange-200',
  VERIFY: 'bg-purple-100 text-purple-800 border-purple-200',
  SUSPEND: 'bg-red-100 text-red-800 border-red-200',
  FREEZE: 'bg-blue-100 text-blue-800 border-blue-200',
  REACTIVATE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ARCHIVE: 'bg-gray-100 text-gray-700 border-gray-200',
}

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_COLORS[action] ?? 'bg-muted text-muted-foreground border-border'
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border font-mono', cls)}>
      {action}
    </span>
  )
}

const ENTITY_ICON: Record<string, React.ReactNode> = {
  TEMPLE: <Shield size={12} />,
  DECLARATION: <FileText size={12} />,
  TRUST: <CheckCircle size={12} />,
  USER: <User size={12} />,
}

function EntityDisplay({ entityType, entityId }: { entityType: string; entityId: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">{ENTITY_ICON[entityType] ?? <Settings size={12} />}</span>
      <span className="font-medium">{entityType}</span>
      <span className="text-muted-foreground text-xs">#{entityId}</span>
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'bg-violet-100 text-violet-800',
    DISTRICT_COLLECTOR: 'bg-blue-100 text-blue-800',
    DC_STAFF: 'bg-sky-100 text-sky-800',
    TEMPLE_AUTHORITY: 'bg-amber-100 text-amber-800',
    AUDITOR: 'bg-teal-100 text-teal-800',
  }
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide', map[role] ?? 'bg-muted text-muted-foreground')}>
      {role?.replace(/_/g, ' ')}
    </span>
  )
}

export function AuditLogPage() {
  const [activeTab, setActiveTab] = useState<'mutation' | 'auth' | 'governance'>('mutation')
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const mutationQuery = useListAuditEventsQuery({ page, size: DEFAULT_PAGE_SIZE }, { skip: activeTab !== 'mutation' })
  const authQuery = useListAuthEventsQuery({ page, size: DEFAULT_PAGE_SIZE }, { skip: activeTab !== 'auth' })
  const governanceQuery = useListGovernanceHistoryQuery({ page, size: DEFAULT_PAGE_SIZE }, { skip: activeTab !== 'governance' })

  const isLoading = activeTab === 'mutation' ? mutationQuery.isLoading : activeTab === 'auth' ? authQuery.isLoading : governanceQuery.isLoading
  const isError = activeTab === 'mutation' ? mutationQuery.isError : activeTab === 'auth' ? authQuery.isError : governanceQuery.isError
  const data = activeTab === 'mutation' ? mutationQuery.data : activeTab === 'auth' ? authQuery.data : governanceQuery.data

  const events = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0
  const totalElements = data?.data?.totalElements ?? 0

  const filteredEvents = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    return (events as (AuditEventResponse | AuthEventResponse | GovernanceHistoryResponse)[]).filter((event) => {
      const raw = JSON.stringify(event).toLowerCase()
      const matchesSearch = !normalized || raw.includes(normalized)
      let matchesDate = true
      if (dateFrom || dateTo) {
        const tsRaw = 'occurredAt' in event ? event.occurredAt : 'timestamp' in event ? (event as GovernanceHistoryResponse).timestamp : undefined
        if (tsRaw) {
          const ts = new Date(tsRaw).getTime()
          if (dateFrom && ts < new Date(dateFrom).getTime()) matchesDate = false
          if (dateTo && ts > new Date(dateTo + 'T23:59:59').getTime()) matchesDate = false
        }
      }
      return matchesSearch && matchesDate
    })
  }, [events, searchTerm, dateFrom, dateTo])

  const exportCsv = () => {
    const rows =
      activeTab === 'governance'
        ? [['Time', 'Actor ID', 'Actor Role', 'Entity', 'Action', 'Reason'],
           ...filteredEvents.map((e: any) => [formatDate(e.timestamp), e.actorUserId ?? '', e.actorRole ?? '', `${e.entityType}#${e.entityId}`, e.action, e.comment ?? ''])]
        : activeTab === 'mutation'
        ? [['Time', 'Actor ID', 'Actor Role', 'Action', 'Entity', 'Details'],
           ...filteredEvents.map((e: any) => [formatDate(e.occurredAt), e.actorId ?? '', e.actorRole ?? '', e.action, `${e.entityType}#${e.entityId}`, e.details ?? ''])]
        : [['Time', 'User', 'Event', 'Status', 'IP'],
           ...filteredEvents.map((e: any) => [formatDate(e.occurredAt), e.username, e.eventType, e.status, e.ipAddress ?? ''])]
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = activeTab === 'governance' ? 'governance-history.csv' : activeTab === 'mutation' ? 'data-mutations.csv' : 'auth-events.csv'
    a.click(); URL.revokeObjectURL(url)
  }

  const handleTabChange = (v: string) => {
    setActiveTab(v as typeof activeTab); setPage(0); setSearchTerm(''); setDateFrom(''); setDateTo(''); setExpandedRow(null)
  }

  if (isError) return <EmptyState title="Failed to load audit log" action={{ label: 'Retry', onClick: () => window.location.reload() }} />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Complete record of all system activity and data changes</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={filteredEvents.length === 0} className="gap-2">
          <Download size={14} /> Export CSV
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <TabsList className="bg-muted/50 border border-border p-1 h-auto">
            <TabsTrigger value="mutation" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Shield size={13} /> Data Mutations
            </TabsTrigger>
            <TabsTrigger value="governance" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <AlertTriangle size={13} /> Governance
            </TabsTrigger>
            <TabsTrigger value="auth" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Lock size={13} /> Authentication
            </TabsTrigger>
          </TabsList>
          <span className="text-sm text-muted-foreground font-medium tabular-nums">
            {totalElements.toLocaleString()} total events
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(0) }}
                className="pl-8 h-9 bg-background" placeholder={activeTab === 'mutation' ? 'Search actor, action, entity, details…' : activeTab === 'governance' ? 'Search actor, entity, action, reason…' : 'Search user, event, IP, status…'} />
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-muted-foreground shrink-0" />
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-32 h-9 text-xs bg-background" aria-label="From date" />
              <span className="text-muted-foreground text-xs font-medium">to</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-32 h-9 text-xs bg-background" aria-label="To date" />
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo('') }} className="h-9 px-2 text-muted-foreground hover:text-foreground">Clear</Button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Data Mutations ───────────────────────────────────────────── */}
        <TabsContent value="mutation" className="mt-0">
          {isLoading ? <TableSkeleton rows={10} /> : filteredEvents.length === 0 ? (
            <EmptyState title="No mutation events found" description="Try adjusting your search or date filters." icon={<Shield size={32} className="text-muted-foreground/40" />} />
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="w-8 px-3 py-3" />
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">When</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Who</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Record</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event: any) => (
                    <Fragment key={event.id}>
                      <tr
                        className={cn('border-b border-border hover:bg-muted/30 transition-colors cursor-pointer', expandedRow === event.id && 'bg-muted/20')}
                        onClick={() => setExpandedRow(expandedRow === event.id ? null : event.id)}>
                        <td className="px-3 py-3 text-muted-foreground">
                          {expandedRow === event.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{formatDate(event.occurredAt)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium flex items-center gap-1"><User size={11} className="text-muted-foreground" />User #{event.actorId}</span>
                            {event.actorRole && <RoleBadge role={event.actorRole} />}
                          </div>
                        </td>
                        <td className="px-4 py-3"><ActionBadge action={event.action} /></td>
                        <td className="px-4 py-3"><EntityDisplay entityType={event.entityType} entityId={event.entityId} /></td>
                      </tr>
                      {expandedRow === event.id && (
                        <tr key={`${event.id}-exp`} className="bg-muted/10 border-b border-border">
                          <td colSpan={5} className="px-12 py-3">
                            {event.details
                              ? <div className="flex items-start gap-2 text-sm"><FileText size={13} className="text-muted-foreground mt-0.5 shrink-0" /><span className="text-muted-foreground italic break-all">{event.details}</span></div>
                              : <span className="text-xs text-muted-foreground">No additional details recorded</span>}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ─── Governance ───────────────────────────────────────────────── */}
        <TabsContent value="governance" className="mt-0">
          {isLoading ? <TableSkeleton rows={10} /> : filteredEvents.length === 0 ? (
            <EmptyState title="No governance events found" description="Temple lifecycle actions (suspend, freeze, archive) will appear here." icon={<History size={32} className="text-muted-foreground/40" />} />
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">When</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Performed by</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Affected record</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason on record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEvents.map((event: any) => (
                    <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{formatDate(event.timestamp)}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium flex items-center gap-1"><User size={11} className="text-muted-foreground" />User #{event.actorUserId}</span>
                          {event.actorRole && <RoleBadge role={event.actorRole} />}
                        </div>
                      </td>
                      <td className="px-4 py-3"><ActionBadge action={event.action} /></td>
                      <td className="px-4 py-3"><EntityDisplay entityType={event.entityType} entityId={event.entityId} /></td>
                      <td className="px-4 py-3 max-w-xs">
                        {event.comment
                          ? <span className="text-sm italic text-foreground/80 line-clamp-2">"{event.comment}"</span>
                          : <span className="text-muted-foreground text-xs">No reason recorded</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ─── Authentication ───────────────────────────────────────────── */}
        <TabsContent value="auth" className="mt-0">
          {isLoading ? <TableSkeleton rows={10} /> : filteredEvents.length === 0 ? (
            <EmptyState title="No authentication events found" icon={<Lock size={32} className="text-muted-foreground/40" />} />
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">When</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Result</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEvents.map((event: any) => (
                    <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{formatDate(event.occurredAt)}</span></td>
                      <td className="px-4 py-3 font-medium">{event.username}</td>
                      <td className="px-4 py-3"><span className="font-mono text-xs text-muted-foreground">{event.eventType}</span></td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
                          event.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')}>
                          {event.status === 'SUCCESS' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          {event.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{event.ipAddress ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>Previous</Button>
          <span className="text-sm text-muted-foreground px-2">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>Next</Button>
        </div>
      )}
    </div>
  )
}
