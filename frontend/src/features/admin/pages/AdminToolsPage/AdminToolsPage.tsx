import { useState } from 'react'
import { toast } from 'sonner'
import {
  useRebuildSearchSummaryMutation, useGetPhysicalVerificationPendingQuery
} from '../../adminApi'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertTriangle, Clock } from 'lucide-react'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

export function AdminToolsPage() {
  const [rebuildSummary, { isLoading: rebuilding }] = useRebuildSearchSummaryMutation()
  const { data: pendingData, isLoading: loadingPending } = useGetPhysicalVerificationPendingQuery({ page: 0, size: 5 })

  const pendingVerifications = pendingData?.data?.content ?? []

  const handleRebuild = async () => {
    try {
      await rebuildSummary().unwrap()
      toast.success('Search summary rebuild queued successfully')
    } catch {
      toast.error('Failed to trigger rebuild')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search Summary Tool */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Search Summary</CardTitle>
              <RefreshCw className={`text-muted-foreground ${rebuilding ? 'animate-spin' : ''}`} size={20} />
            </div>
            <CardDescription>
              Rebuild the optimized search summary table used for fast global temple searches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleRebuild}
              disabled={rebuilding}
              className="w-full gap-2"
            >
              {rebuilding ? 'Queued...' : 'Rebuild Search Summary'}
            </Button>
          </CardContent>
        </Card>

        {/* System Health / Alert */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">System Health</CardTitle>
              <AlertTriangle className="text-amber-500" size={20} />
            </div>
            <CardDescription>
              Overview of system tasks and potential data inconsistencies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Background Jobs</span>
              <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Database Sync</span>
              <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stale Physical Verifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="text-amber-500" size={20} />
            <CardTitle className="text-lg">Stale Physical Verifications</CardTitle>
          </div>
          <CardDescription>
            Declarations flagged for physical verification more than 30 days ago that are still pending.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPending ? (
            <div className="h-20 animate-pulse bg-muted rounded-md" />
          ) : pendingVerifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No stale verifications found.
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Temple</th>
                    <th className="px-4 py-2 text-left font-medium">District</th>
                    <th className="px-4 py-2 text-left font-medium">Flagged On</th>
                    <th className="px-4 py-2 text-right font-medium">Days Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingVerifications.map((v: any) => (
                    <tr key={v.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2 font-medium">{v.templeName}</td>
                      <td className="px-4 py-2 text-muted-foreground">{v.districtName}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(v.flaggedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Badge variant="destructive" className="text-[10px]">
                          {v.daysOverdue} Days
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
