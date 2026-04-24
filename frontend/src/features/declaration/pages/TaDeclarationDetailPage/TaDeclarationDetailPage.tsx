import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useGetDeclarationDiffQuery,
  useGetDeclarationQuery,
  useGetDeclarationVersionsQuery,
} from '../../declarationApi'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { DeclarationHeader, ClarificationAlert } from './components'

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
const DiffTab = lazy(() => import('./components/DiffTab').then((module) => ({ default: module.DiffTab })))

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
    { skip: !isValid || !compareVersion }
  )
  const diff = diffQuery.data?.data ?? []

  useEffect(() => {
    if (!compareVersion && versions.length > 1) {
      setCompareVersion(versions[1].versionNumber)
    }
  }, [compareVersion, versions])

  const activeVersion = useMemo(
    () => versions.find((version) => version.versionNumber === compareVersion) ?? versions[0],
    [versions, compareVersion]
  )

  if (!isValid) {
    return <EmptyState title="Invalid declaration" description="The declaration ID is not valid." />
  }

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
      <ClarificationAlert status={declaration.status} />

      <Tabs defaultValue="overview" className="w-full">
        <div className="rounded-lg border border-border/60 bg-card/95 p-1 shadow-sm lg:w-auto">
          <TabsList className="grid w-full grid-cols-4 gap-1 bg-transparent p-0 lg:w-auto">
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
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-5">
          <Suspense fallback={<TabLoadingFallback />}>
            <OverviewTab
              declaration={declaration}
              versions={versions}
              activeVersion={activeVersion}
              onVersionSelect={setCompareVersion}
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
      </Tabs>
    </div>
  )
}
