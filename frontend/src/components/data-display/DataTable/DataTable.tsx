import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export interface ColumnDef<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
  sortable?: boolean
}

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  pagination?: PaginationProps
  sortKey?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (key: string) => void
  rowKey: (row: T) => string | number
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'No results found',
  emptyDescription = 'Try adjusting your filters.',
  pagination,
  sortKey,
  sortOrder,
  onSortChange,
  rowKey,
}: DataTableProps<T>) {
  if (isLoading) return <TableSkeleton rows={6} />

  if (!isLoading && data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left font-semibold text-foreground',
                    col.sortable && 'cursor-pointer select-none hover:text-primary transition-colors',
                    col.className
                  )}
                  onClick={col.sortable && onSortChange ? () => onSortChange(col.key) : undefined}
                >
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    <span className="ml-1 text-primary">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-muted/30 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3', col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => pagination.onPageChange(pagination.page - 1)}
            disabled={pagination.page === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page + 1} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => pagination.onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
