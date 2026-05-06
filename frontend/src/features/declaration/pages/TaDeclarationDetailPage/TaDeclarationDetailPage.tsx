import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useGetDeclarationQuery,
  useGetDeclarationVersionsQuery,
  useGetDeclarationDiffQuery,
} from '../../declarationApi'
import {
  resubmitDeclarationSchema,
  type CompleteDeclarationResponse,
  type ResubmitDeclarationRequest,
} from '../../declarationTypes'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { DeclarationHeader, ClarificationAlert, RejectionAlert } from './components'
import { WorkflowGovernancePanel } from '@/features/governance/WorkflowGovernancePanel'

// Lazy load tab components for code splitting
const OverviewTab = lazy(() =>
  import('./components/OverviewTab').then((module) => ({ default: module.OverviewTab }))
)
const AssetsTab = lazy(() =>
  import('./components/AssetsTab').then((module) => ({ default: module.AssetsTab }))
)
const HistoryTab = lazy(() =>
  import('./components/HistoryTab').then((module) => ({ default: module.HistoryTab }))
)
const DiffTab = lazy(() =>
  import('./components/DiffTab').then((module) => ({ default: module.DiffTab }))
)

// Loading fallback component
function TabLoadingFallback() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}

// Page loading skeleton component
function PageLoadingSkeleton() {
  return (
    <div className="space-y-5 pb-10">
      {/* Header Skeleton */}
      <div className="overflow-hidden rounded-lg border border-border/60 bg-card/95 shadow-sm">
        <div className="space-y-4 p-5">
          {/* Back button and action button */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            <div className="h-9 w-40 animate-pulse rounded bg-muted" />
          </div>

          {/* Title and status */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted" />
              <div className="space-y-2">
                <div className="h-7 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-64 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-6 w-20 animate-pulse rounded-md bg-muted" />
            <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-6 w-20 animate-pulse rounded-md bg-muted" />
          </div>

          {/* Stats grid */}
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-5">
        <div className="rounded-lg border border-border/60 bg-card/95 p-1 shadow-sm w-fit">
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-9 w-24 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>

        {/* Tab content skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function TaDeclarationDetailPage() {
  const { id: rawId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const id = Number(rawId)
  const isValid = Number.isFinite(id) && id > 0

  const declarationQuery = useGetDeclarationQuery(id, { skip: !isValid })
  const versionsQuery = useGetDeclarationVersionsQuery(id, { skip: !isValid })
  const declaration = declarationQuery.data?.data
  const versions = versionsQuery.data?.data ?? []
  const [compareVersion, setCompareVersion] = useState<number | undefined>(undefined)

  const diffQuery = useGetDeclarationDiffQuery(
    { id, compareToVersion: compareVersion },
    { skip: !isValid || !id }
  )
  const diff = diffQuery.data?.data ?? []

  useEffect(() => {
    if (!compareVersion && versions.length > 1) {
      setCompareVersion(versions[1].versionNumber)
    }
  }, [compareVersion, versions])

  // Helper function to map declaration to form request
  const mapDeclarationToRequest = (_decl: CompleteDeclarationResponse): ResubmitDeclarationRequest => {
    return {
      // Map the declaration fields to the resubmit request format
      // Add the actual mapping based on your schema
      // This is a placeholder - adjust according to your actual types
    } as ResubmitDeclarationRequest
  }

  const emptyValues: ResubmitDeclarationRequest = {} as ResubmitDeclarationRequest

  const form = useForm<ResubmitDeclarationRequest>({
    resolver: zodResolver(resubmitDeclarationSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (declaration) {
      form.reset(mapDeclarationToRequest(declaration))
    }
  }, [declaration, form])
  
  const activeVersion = useMemo(
    () => versions.find((version) => version.versionNumber === compareVersion) ?? versions[0],
    [versions, compareVersion]
  )

  if (!isValid) {
    return <EmptyState title="Invalid declaration" description="The declaration ID is not valid." />
  }

  // Show loading skeleton while fetching declaration
  if (declarationQuery.isLoading) {
    return <PageLoadingSkeleton />
  }

  // Show error state only after loading is complete
  if (declarationQuery.isError || !declaration) {
    return (
      <EmptyState
        title="Declaration not found"
        description="We could not load this declaration."
        action={{ label: 'Back to declarations', onClick: () => navigate(ROUTE_PATHS.TA_DECLARATIONS) }}
      />
    )
  }

  return (
    <div className="space-y-5 pb-10">
      <DeclarationHeader declaration={declaration} versions={versions} />
      
      {/* Show clarification alert if clarification is required */}
      <ClarificationAlert status={declaration.status} />
      
      {/* Show rejection alert if declaration is rejected */}
      <RejectionAlert 
        status={declaration.status} 
        declarationId={declaration.id}
        rejectionReason={declaration.rejectionReason ?? undefined}
      />

      <Tabs defaultValue="overview" className="w-full">
        <div className="rounded-lg border border-border/60 bg-card/95 p-1 shadow-sm lg:w-auto">
          <TabsList className="grid w-full grid-cols-5 gap-1 bg-transparent p-0 lg:w-auto">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="assets"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              Assets
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              History
            </TabsTrigger>
            <TabsTrigger
              value="diff"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              Diff
            </TabsTrigger>
            <TabsTrigger
              value="governance"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              Governance
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-5">
          <Suspense fallback={<TabLoadingFallback />}>
            <OverviewTab
              declaration={declaration}
              versions={versions}
              activeVersion={activeVersion}
              onVersionSelect={setCompareVersion}
              declarationId={declaration.id}
              declarationStatus={declaration.status}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="assets" className="mt-5">
          <Suspense fallback={<TabLoadingFallback />}>
            <AssetsTab declaration={declaration} />
          </Suspense>
        </TabsContent>

        <TabsContent value="history" className="mt-5">
          <Suspense fallback={<TabLoadingFallback />}>
            <HistoryTab
              versions={versions}
              activeVersion={activeVersion}
              onVersionSelect={setCompareVersion}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="diff" className="mt-5">
          <Suspense fallback={<TabLoadingFallback />}>
            <DiffTab
              versions={versions}
              compareVersion={compareVersion}
              onCompareVersionChange={setCompareVersion}
              diff={diff}
              isLoading={diffQuery.isLoading}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="governance" className="mt-5">
          {declaration.workflowInstanceId ? (
            <WorkflowGovernancePanel workflowInstanceId={declaration.workflowInstanceId} />
          ) : (
            <EmptyState
              title="Governance not available"
              description="This declaration was created before the workflow engine was activated. Submit a new version to enable governance tracking."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
