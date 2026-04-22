import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider } from 'react-hook-form'
import { toast } from 'sonner'
import {
  useGetDeclarationDiffQuery,
  useGetDeclarationQuery,
  useGetDeclarationVersionsQuery,
  useResubmitDeclarationMutation,
} from '../../declarationApi'
import {
  resubmitDeclarationSchema,
  type CompleteDeclarationResponse,
  type ResubmitDeclarationRequest,
} from '../../declarationTypes'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Form } from '@/components/ui/form'
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
const ResubmitTab = lazy(() =>
  import('./components/ResubmitTab').then((module) => ({ default: module.ResubmitTab }))
)

// Loading fallback component
function TabLoadingFallback() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
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
  const [resubmit, { isLoading: resubmitting }] = useResubmitDeclarationMutation()

  useEffect(() => {
    if (!compareVersion && versions.length > 1) {
      setCompareVersion(versions[1].versionNumber)
    }
  }, [compareVersion, versions])

  const form = useForm<ResubmitDeclarationRequest>({
    resolver: zodResolver(resubmitDeclarationSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (declaration) {
      form.reset(mapDeclarationToRequest(declaration))
    }
  }, [declaration, form])

  const isClarificationPending =
    declaration?.status === 'CLARIFICATION_REQUESTED' || declaration?.status === 'REJECTED'
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

  const handleResubmit = form.handleSubmit(async (values) => {
    try {
      const result = await resubmit({ id, body: values }).unwrap()
      const nextId = result.data?.id
      toast.success('Declaration resubmitted successfully.')
      if (nextId) {
        navigate(ROUTE_PATHS.TA_DECLARATION_DETAIL.replace(':id', String(nextId)))
      } else {
        navigate(ROUTE_PATHS.TA_DECLARATIONS)
      }
    } catch {
      toast.error('Failed to resubmit declaration.')
    }
  })

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <div className="space-y-6 pb-10">
          <DeclarationHeader declaration={declaration} versions={versions} />
          <ClarificationAlert status={declaration.status} />

          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="diff">Diff</TabsTrigger>
              <TabsTrigger value="resubmit" disabled={!isClarificationPending}>
                Resubmit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Suspense fallback={<TabLoadingFallback />}>
                <OverviewTab
                  declaration={declaration}
                  versions={versions}
                  activeVersion={activeVersion}
                  onVersionSelect={setCompareVersion}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="assets" className="mt-6">
              <Suspense fallback={<TabLoadingFallback />}>
                <AssetsTab declaration={declaration} />
              </Suspense>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <Suspense fallback={<TabLoadingFallback />}>
                <HistoryTab
                  versions={versions}
                  activeVersion={activeVersion}
                  onVersionSelect={setCompareVersion}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="diff" className="mt-6">
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

            <TabsContent value="resubmit" className="mt-6">
              <Suspense fallback={<TabLoadingFallback />}>
                <ResubmitTab onResubmit={handleResubmit} isResubmitting={resubmitting} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </Form>
    </FormProvider>
  )
}

const emptyValues: ResubmitDeclarationRequest = {
  clarificationResponse: '',
  financialYear: '',
  dueDate: '',
  annualIncome: undefined,
  annualExpenditure: undefined,
  agriculturalLands: [],
  buildings: [],
  leasedProperties: [],
  otherLands: [],
  preciousMetals: [],
  artifacts: [],
  vehicles: [],
  equipment: [],
  financialAssets: [],
}

function mapDeclarationToRequest(
  declaration: CompleteDeclarationResponse
): ResubmitDeclarationRequest {
  return {
    clarificationResponse: '',
    financialYear: declaration.financialYear ?? '',
    dueDate: declaration.dueDate ?? '',
    annualIncome: declaration.annualIncome ?? undefined,
    annualExpenditure: declaration.annualExpenditure ?? undefined,
    agriculturalLands: declaration.agriculturalLands.map((item) => ({
      id: item.id,
      surveyNumber: item.surveyNumber ?? '',
      village: item.village ?? '',
      areaAcres: item.areaAcres ?? undefined,
      ownerOfRecord: item.ownerOfRecord ?? '',
      pattaStatus: item.pattaStatus ?? '',
    })),
    buildings: declaration.buildings.map((item) => ({
      id: item.id,
      location: item.location ?? '',
      totalAreaSqft: item.totalAreaSqft ?? undefined,
      yearBuilt: item.yearBuilt ?? undefined,
      structureType: item.structureType ?? '',
      valuationInr: item.valuationInr ?? undefined,
    })),
    leasedProperties: declaration.leasedProperties.map((item) => ({
      id: item.id,
      propertyAddress: item.propertyAddress ?? '',
      lesseeName: item.lesseeName ?? '',
      leaseStartDate: item.leaseStartDate ?? '',
      leaseEndDate: item.leaseEndDate ?? '',
      monthlyRent: item.monthlyRent ?? undefined,
      agreementDocumentId: item.agreementDocumentId ?? undefined,
    })),
    otherLands: declaration.otherLands.map((item) => ({
      id: item.id,
      location: item.location ?? '',
      area: item.area ?? undefined,
      usageType: item.usageType ?? '',
      revenueDepartmentReference: item.revenueDepartmentReference ?? '',
    })),
    preciousMetals: declaration.preciousMetals.map((item) => ({
      id: item.id,
      itemDescription: item.itemDescription ?? '',
      metalType: item.metalType ?? '',
      weightGrams: item.weightGrams ?? undefined,
      purity: item.purity ?? '',
      approximateValueInr: item.approximateValueInr ?? undefined,
    })),
    artifacts: declaration.artifacts.map((item) => ({
      id: item.id,
      itemDescription: item.itemDescription ?? '',
      material: item.material ?? '',
      ageOrPeriod: item.ageOrPeriod ?? '',
      provenance: item.provenance ?? '',
      museumGradeClassification: item.museumGradeClassification ?? '',
    })),
    vehicles: declaration.vehicles.map((item) => ({
      id: item.id,
      registrationNumber: item.registrationNumber ?? '',
      makeModel: item.makeModel ?? '',
      year: item.year ?? undefined,
      purpose: item.purpose ?? '',
    })),
    equipment: declaration.equipment.map((item) => ({
      id: item.id,
      itemName: item.itemName ?? '',
      serialNumber: item.serialNumber ?? '',
      approximateValueInr: item.approximateValueInr ?? undefined,
    })),
    financialAssets: declaration.financialAssets.map((item) => ({
      id: item.id,
      assetSubtype: item.assetSubtype ?? '',
      bankName: item.bankName ?? '',
      amount: item.amount ?? undefined,
      maturityDate: item.maturityDate ?? '',
    })),
  }
}
