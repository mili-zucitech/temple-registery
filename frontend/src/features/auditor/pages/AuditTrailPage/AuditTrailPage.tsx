import { useMemo, useState } from 'react'
import { useGetAuditTrailQuery } from '@/features/auditor/auditorApi'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { History, Download, Search } from 'lucide-react'

const ENTITY_TYPES = ['TEMPLE', 'DECLARATION', 'TRUST', 'EMPLOYEE', 'CONTRACTOR'] as const

export function AuditTrailPage() {
  const [entityType, setEntityType] = useState<(typeof ENTITY_TYPES)[number]>('TEMPLE')
  const [entityId, setEntityId] = useState('')
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [query, setQuery] = useState<{ entityType: string; entityId: number } | null>(null)

  const { data, isLoading, isError } = useGetAuditTrailQuery(
    { entityType: query?.entityType ?? 'TEMPLE', entityId: query?.entityId ?? 0, page, size: 50 },
    { skip: query === null }
  )
  const entries = data?.data ?? []

  const visibleEntries = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return entries
    return entries.filter((entry) =>
      entry.action.toLowerCase().includes(normalized) ||
      entry.source.toLowerCase().includes(normalized) ||
      (entry.detail ?? '').toLowerCase().includes(normalized) ||
      (entry.actorRole ?? '').toLowerCase().includes(normalized)
    )
  }, [entries, keyword])

  const selectedEntry = selectedIndex !== null ? visibleEntries[selectedIndex] : null

  const exportCsv = () => {
    const header = ['Timestamp', 'Source', 'Action', 'Actor Role', 'Actor User ID', 'Entity', 'Detail']
    const rows = visibleEntries.map((entry) => [
      entry.timestamp,
      entry.source,
      entry.action,
      entry.actorRole ?? '',
      entry.actorUserId ?? '',
      `${entry.entityType}#${entry.entityId}`,
      entry.detail ?? '',
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-trail-${query?.entityType ?? 'entity'}-${query?.entityId ?? 'id'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History size={20} />
        <h1 className="text-2xl font-bold">Audit Trail</h1>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium">Entity Type</label>
            <Select value={entityType} onValueChange={(value) => setEntityType(value as (typeof ENTITY_TYPES)[number])}>
              <SelectTrigger>
                <SelectValue placeholder="Select entity type" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Entity ID</label>
            <Input type="number" value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="123" />
          </div>
          <Button
            disabled={!entityType || !entityId}
            onClick={() => {
              setQuery({ entityType, entityId: Number(entityId) })
              setPage(0)
              setSelectedIndex(null)
            }}
          >
            Load Trail
          </Button>
        </div>

        {query && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <div className="relative md:col-span-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-8"
                placeholder="Search action, source, actor, detail"
              />
            </div>
            <Button variant="outline" onClick={exportCsv} disabled={visibleEntries.length === 0}>
              <Download size={14} className="mr-2" /> Export CSV
            </Button>
          </div>
        )}
      </div>

      {query === null ? null : isLoading ? (
        <TableSkeleton rows={10} />
      ) : isError ? (
        <EmptyState title="Failed to load audit trail" />
      ) : visibleEntries.length === 0 ? (
        <EmptyState title="No audit trail entries" icon={<History size={32} />} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border overflow-hidden bg-card xl:col-span-2">
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Actor</th>
                <th className="px-4 py-3 font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleEntries.map((e, i) => (
                <tr
                  key={i}
                  className={`hover:bg-muted/30 transition-colors cursor-pointer ${selectedIndex === i ? 'bg-muted/40' : ''}`}
                  onClick={() => setSelectedIndex(i)}
                >
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3"><Badge variant="outline">{e.source}</Badge></td>
                  <td className="px-4 py-3 font-mono text-xs text-primary">{e.action}</td>
                  <td className="px-4 py-3 text-xs">{e.actorRole ?? '—'} #{e.actorUserId}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-xs">{e.detail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Entry Detail</h3>
            {selectedEntry ? (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Action</dt>
                  <dd className="font-medium">{selectedEntry.action}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Source</dt>
                  <dd className="font-medium">{selectedEntry.source}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Actor</dt>
                  <dd className="font-medium">{selectedEntry.actorRole ?? 'Unknown'} #{selectedEntry.actorUserId ?? 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Entity</dt>
                  <dd className="font-medium">{selectedEntry.entityType} #{selectedEntry.entityId}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Timestamp</dt>
                  <dd className="font-medium">{selectedEntry.timestamp ? new Date(selectedEntry.timestamp).toLocaleString() : '\u2014'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Detail</dt>
                  <dd className="text-muted-foreground break-words">{selectedEntry.detail ?? 'No additional details.'}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Select a row to inspect full details.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
