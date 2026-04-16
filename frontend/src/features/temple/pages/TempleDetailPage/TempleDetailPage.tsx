import { useParams } from 'react-router-dom'
import { useTempleDetail } from '../../templeHooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { TempleGradeBadge } from '@/components/data-display/StatusBadge/TempleGradeBadge'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { Building2 } from 'lucide-react'

export function TempleDetailPage() {
  const { templeId } = useParams<{ templeId: string }>()
  const { temple, isLoading, isError } = useTempleDetail(Number(templeId))

  if (isLoading) return <CardSkeleton />

  if (isError || !temple) {
    return (
      <EmptyState
        title="Temple not found"
        description="The temple you are looking for does not exist or you do not have access."
        icon={<Building2 size={32} />}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-soft-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-semibold">{temple.name}</h2>
              <TempleGradeBadge grade={temple.grade} />
              {temple.assetDeclarationStatus && (
                <StatusBadge status={temple.assetDeclarationStatus} />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{temple.tradition} · {temple.villageTown ?? 'Location not set'}</p>
            {temple.contactName && (
              <p className="text-xs text-muted-foreground mt-1">
                Contact: {temple.contactName} {temple.contactMobile && `· ${temple.contactMobile}`}
              </p>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            <span className={temple.trustRegistered ? 'text-success font-medium' : ''}>
              {temple.trustRegistered ? 'Trust Registered' : 'No Trust'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trust">
        <TabsList>
          <TabsTrigger value="trust">Trust & Board</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="contractors">Contractors</TabsTrigger>
          <TabsTrigger value="declarations">Declarations</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="trust" className="mt-4">
          <p className="text-sm text-muted-foreground">Trust details tab — loads trust module content.</p>
        </TabsContent>
        <TabsContent value="employees" className="mt-4">
          <p className="text-sm text-muted-foreground">Employee list for temple {templeId}.</p>
        </TabsContent>
        <TabsContent value="contractors" className="mt-4">
          <p className="text-sm text-muted-foreground">Contractor list for temple {templeId}.</p>
        </TabsContent>
        <TabsContent value="declarations" className="mt-4">
          <p className="text-sm text-muted-foreground">Asset declarations for temple {templeId}.</p>
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <div className="space-y-2">
            <h3 className="font-semibold mb-2">Temple Photo</h3>
            {temple.photoUrl ? (
              <img
                src={temple.photoUrl}
                alt="Temple Photo"
                className="w-32 h-32 object-cover rounded border"
              />
            ) : (
              <p className="text-muted-foreground">No photo uploaded for this temple.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
