import { useMemo, useState } from 'react'
import { useGetComplianceReportQuery } from '@/features/auditor/auditorApi'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShieldCheck, Download, ArrowUpDown } from 'lucide-react'

const ANOMALY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OVERDUE_DECLARATION: 'destructive',
  NO_APPROVED_DECLARATION: 'default',
  NO_TRUST_REGISTERED: 'secondary',
}

export function ComplianceReportPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [anomalyFilter, setAnomalyFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState<'temple' | 'district' | 'anomaly'>('anomaly')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const { data, isLoading, isError, refetch } = useGetComplianceReportQuery()
  const anomalies = data?.data ?? []

  const anomalyOptions = useMemo(() => {
    return Array.from(new Set(anomalies.map((a) => a.anomalyType))).sort()
  }, [anomalies])

  const filtered = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    const withFilter = anomalies.filter((item) => {
      const matchesType = anomalyFilter === 'ALL' || item.anomalyType === anomalyFilter
      const matchesSearch =
        normalized.length === 0 ||
        item.templeName.toLowerCase().includes(normalized) ||
        (item.districtName ?? '').toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized)
      return matchesType && matchesSearch
    })

    return [...withFilter].sort((a, b) => {
      if (sortBy === 'temple') return a.templeName.localeCompare(b.templeName)
      if (sortBy === 'district') return (a.districtName ?? '').localeCompare(b.districtName ?? '')
      return a.anomalyType.localeCompare(b.anomalyType)
    })
  }, [anomalies, anomalyFilter, searchTerm, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visibleRows = filtered.slice(page * pageSize, page * pageSize + pageSize)

  const overdueCount = anomalies.filter((a) => a.anomalyType === 'OVERDUE_DECLARATION').length
  const noTrustCount = anomalies.filter((a) => a.anomalyType === 'NO_TRUST_REGISTERED').length
  const noApprovedCount = anomalies.filter((a) => a.anomalyType === 'NO_APPROVED_DECLARATION').length

  const exportCsv = () => {
    const header = ['Temple', 'District', 'Anomaly', 'Description', 'Detected At']
    const rows = filtered.map((a) => [
      a.templeName,
      a.districtName ?? '',
      a.anomalyType,
      a.description,
      a.detectedAt,
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'auditor-compliance-report.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isError) return <EmptyState title="Failed to load compliance report" action={{ label: 'Retry', onClick: refetch }} />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck size={20} />
        <h1 className="text-2xl font-bold">Compliance Report</h1>
        {!isLoading && (
          <span className="ml-auto text-sm text-muted-foreground">{filtered.length} / {anomalies.length} anomalies</span>
        )}
      </div>

      {!isLoading && (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Flags</p>
            <p className="text-2xl font-semibold mt-2">{anomalies.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Overdue Declarations</p>
            <p className="text-2xl font-semibold mt-2">{overdueCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">No Trust Registered</p>
            <p className="text-2xl font-semibold mt-2">{noTrustCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">No Approved Declaration</p>
            <p className="text-2xl font-semibold mt-2">{noApprovedCount}</p>
          </div>
        </section>
      )}

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : anomalies.length === 0 ? (
        <EmptyState title="No compliance anomalies found" icon={<ShieldCheck size={32} />} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setPage(0)
                  setSearchTerm(e.target.value)
                }}
                placeholder="Search temple, district, description"
                className="lg:col-span-2"
              />
              <Select value={anomalyFilter} onValueChange={(value) => { setPage(0); setAnomalyFilter(value) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter anomaly" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All anomaly types</SelectItem>
                  {anomalyOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSortBy((prev) => prev === 'anomaly' ? 'temple' : prev === 'temple' ? 'district' : 'anomaly')}>
                  <ArrowUpDown size={14} className="mr-2" />
                  Sort: {sortBy}
                </Button>
                <Button variant="outline" onClick={exportCsv}>
                  <Download size={14} className="mr-2" /> Export
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Temple</th>
                <th className="px-4 py-3 font-semibold">District</th>
                <th className="px-4 py-3 font-semibold">Anomaly</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleRows.map((a, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{a.templeName ?? `#${a.templeId}`}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.districtName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ANOMALY_VARIANT[a.anomalyType] ?? 'outline'}>{a.anomalyType.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{a.description}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {a.detectedAt ? new Date(a.detectedAt).toLocaleDateString() : '\u2014'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
