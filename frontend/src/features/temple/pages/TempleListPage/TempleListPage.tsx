import { useTempleSearch } from '../../templeHooks'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { TempleGradeBadge } from '@/components/data-display/StatusBadge/TempleGradeBadge'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { TempleSearchFilterRequest } from '../../templeTypes'
import { TEMPLE_GRADES } from '../../templeTypes'
import { Building2 } from 'lucide-react'

export function TempleListPage() {
  const { temples, total, totalPages, isLoading, isError, currentPage, applyFilters, goToPage } = useTempleSearch()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [grade, setGrade] = useState<string>('')

  const handleSearch = () => {
    const filters: TempleSearchFilterRequest = {}
    if (name) filters.name = name
    if (grade) filters.grade = grade as TempleSearchFilterRequest['grade']
    applyFilters(filters)
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to load temples"
        description="An error occurred while fetching temple data. Please try again."
        action={{ label: 'Retry', onClick: () => window.location.reload() }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-1 block">Temple Name</label>
          <Input
            placeholder="Search by name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="w-40">
          <label className="text-sm font-medium mb-1 block">Grade</label>
          <Select value={grade || 'all'} onValueChange={(v) => setGrade(v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All grades</SelectItem>
              {TEMPLE_GRADES.map((g) => (
                <SelectItem key={g} value={g}>Grade {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} className="bg-gradient-gold shadow-gold">Search</Button>
      </div>

      {/* Results */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">{total.toLocaleString()} temple(s) found</p>

        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : temples.length === 0 ? (
          <EmptyState
            title="No temples found"
            description="Try adjusting your search filters."
            icon={<Building2 size={32} />}
          />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Grade</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">District</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Declaration</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Trust</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {temples.map((temple) => (
                  <tr key={temple.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{temple.name}</td>
                    <td className="px-4 py-3">
                      <TempleGradeBadge grade={temple.grade} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{temple.districtName ?? '—'}</td>
                    <td className="px-4 py-3">
                      {temple.declarationStatus
                        ? <StatusBadge status={temple.declarationStatus} />
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={temple.trustRegistered ? 'text-success' : 'text-muted-foreground'}>
                        {temple.trustRegistered ? 'Registered' : 'Not registered'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/dc/temples/${temple.templeId}`)}
                      >
                        View
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
