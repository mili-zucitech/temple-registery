import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListObservationsQuery } from '@/features/auditor/auditorApi'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, Plus, Search, ArrowUpDown } from 'lucide-react'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { CreateObservationDialog } from '../../components/CreateObservationDialog/CreateObservationDialog'

const SEVERITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'default',
  CRITICAL: 'destructive',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OPEN: 'destructive',
  ASSIGNED: 'default',
  CLOSED: 'secondary',
}

const STATUS_TABS = ['ALL', 'OPEN', 'ASSIGNED', 'CLOSED'] as const

export function ObservationsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [activeTab, setActiveTab] = useState<string>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'createdAt' | 'severity' | 'title'>('createdAt')

  const statusParam = activeTab === 'ALL' ? undefined : activeTab
  const { data, isLoading, isError, refetch } = useListObservationsQuery({ status: statusParam, page, size: 20 })
  const observations = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0
  const totalElements = data?.data?.totalElements ?? 0

  const visibleRows = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    const filtered = observations.filter((obs) => {
      if (!normalized) return true
      return (
        obs.title.toLowerCase().includes(normalized) ||
        (obs.templeName ?? '').toLowerCase().includes(normalized) ||
        String(obs.templeId).includes(normalized)
      )
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'severity') return a.severity.localeCompare(b.severity)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [observations, searchTerm, sortBy])

  const openCount = activeTab === 'OPEN' ? totalElements : 0
  const assignedCount = activeTab === 'ASSIGNED' ? totalElements : 0
  const closedCount = activeTab === 'CLOSED' ? totalElements : 0

  if (isError) return <EmptyState title="Failed to load observations" action={{ label: 'Retry', onClick: refetch }} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Eye size={20} />
          <h1 className="text-2xl font-bold">Observations</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus size={16} className="mr-2" />
          Raise Observation
        </Button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Filtered Results</p>
          <p className="text-xl font-semibold mt-1">{visibleRows.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Open</p>
          <p className="text-xl font-semibold mt-1">{openCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Assigned</p>
          <p className="text-xl font-semibold mt-1">{assignedCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Closed</p>
          <p className="text-xl font-semibold mt-1">{closedCount}</p>
        </div>
      </section>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="relative lg:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or temple"
              className="pl-8"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setSortBy((prev) => prev === 'createdAt' ? 'severity' : prev === 'severity' ? 'title' : 'createdAt')}
          >
            <ArrowUpDown size={14} className="mr-2" /> Sort: {sortBy}
          </Button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(0) }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : observations.length === 0 ? (
        <EmptyState title="No observations found" icon={<Eye size={32} />} />
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Temple</th>
                  <th className="px-4 py-3 font-semibold">Severity</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleRows.map((obs) => (
                  <tr
                    key={obs.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(ROUTE_PATHS.AUDITOR_OBSERVATION_DETAIL.replace(':id', String(obs.id)))}
                  >
                    <td className="px-4 py-3 font-medium">{obs.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{obs.templeName ?? `#${obs.templeId}`}</td>
                    <td className="px-4 py-3">
                      <Badge variant={SEVERITY_VARIANT[obs.severity] ?? 'outline'}>{obs.severity}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[obs.status] ?? 'outline'}>{obs.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(obs.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-end gap-2 items-center">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</Button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</Button>
            </div>
          )}
        </>
      )}

      <CreateObservationDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

