import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useGetDeclarationQuery,
  useGetDeclarationVersionsQuery,
} from '../../declarationApi'
import {
  resubmitDeclarationSchema,
  type CompleteDeclarationResponse,
  type ResubmitDeclarationRequest,
} from '../../declarationTypes'
import { getAvailableActions } from '../../declarationPermissions'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { DeclarationHeader, ClarificationAlert, RejectionAlert } from './components'
import { useWithdrawDeclarationMutation } from '@/features/governance/governanceApi'
import type { RootState } from '@/app/store'

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
  const userRole = useSelector((state: RootState) => state.auth.currentUser?.role ?? '')

  const declarationQuery = useGetDeclarationQuery(id, { skip: !isValid })
  const versionsQuery = useGetDeclarationVersionsQuery(id, { skip: !isValid })
  const [withdrawDeclaration, { isLoading: isWithdrawing }] = useWithdrawDeclarationMutation()
  const declaration = declarationQuery.data?.data
  const versions = versionsQuery.data?.data ?? []
  const [compareVersion, setCompareVersion] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!compareVersion && versions.length > 1) {
      setCompareVersion(versions[1].versionNumber)
    }
  }, [compareVersion, versions])

  // Maps an existing declaration response into the resubmit form shape.
  // All asset item IDs are preserved so the backend can update (not duplicate) existing rows.
  // clarificationResponse is left blank — the TA must fill it in before submitting.
  const mapDeclarationToRequest = (decl: CompleteDeclarationResponse): ResubmitDeclarationRequest => {
    return {
      financialYear: decl.financialYear ?? '',
      dueDate: decl.dueDate ?? '',
      annualIncome: decl.annualIncome ?? undefined,
      annualExpenditure: decl.annualExpenditure ?? undefined,
      agriculturalLands: (decl.agriculturalLands ?? []).map((l) => ({
        id: l.id,
        surveyNumber: l.surveyNumber ?? undefined,
        village: l.village ?? undefined,
        areaAcres: l.areaAcres ?? undefined,
        ownerOfRecord: l.ownerOfRecord ?? undefined,
        pattaStatus: l.pattaStatus ?? undefined,
      })),
      buildings: (decl.buildings ?? []).map((b) => ({
        id: b.id,
        location: b.location ?? undefined,
        totalAreaSqft: b.totalAreaSqft ?? undefined,
        yearBuilt: b.yearBuilt ?? undefined,
        structureType: b.structureType ?? undefined,
        valuationInr: b.valuationInr ?? undefined,
      })),
      leasedProperties: (decl.leasedProperties ?? []).map((p) => ({
        id: p.id,
        propertyAddress: p.propertyAddress ?? undefined,
        lesseeName: p.lesseeName ?? undefined,
        leaseStartDate: p.leaseStartDate ?? undefined,
        leaseEndDate: p.leaseEndDate ?? undefined,
        monthlyRent: p.monthlyRent ?? undefined,
        agreementDocumentId: p.agreementDocumentId ?? undefined,
      })),
      otherLands: (decl.otherLands ?? []).map((o) => ({
        id: o.id,
        location: o.location ?? undefined,
        area: o.area ?? undefined,
        usageType: o.usageType ?? undefined,
        revenueDepartmentReference: o.revenueDepartmentReference ?? undefined,
      })),
      preciousMetals: (decl.preciousMetals ?? []).map((m) => ({
        id: m.id,
        itemDescription: m.itemDescription ?? undefined,
        metalType: m.metalType ?? undefined,
        weightGrams: m.weightGrams ?? undefined,
        purity: m.purity ?? undefined,
        approximateValueInr: m.approximateValueInr ?? undefined,
      })),
      artifacts: (decl.artifacts ?? []).map((a) => ({
        id: a.id,
        itemDescription: a.itemDescription ?? undefined,
        material: a.material ?? undefined,
        ageOrPeriod: a.ageOrPeriod ?? undefined,
        provenance: a.provenance ?? undefined,
        museumGradeClassification: a.museumGradeClassification ?? undefined,
        approximateValueInr: a.approximateValueInr ?? undefined,
      })),
      vehicles: (decl.vehicles ?? []).map((v) => ({
        id: v.id,
        registrationNumber: v.registrationNumber ?? undefined,
        makeModel: v.makeModel ?? undefined,
        year: v.year ?? undefined,
        purpose: v.purpose ?? undefined,
      })),
      equipment: (decl.equipment ?? []).map((e) => ({
        id: e.id,
        itemName: e.itemName ?? undefined,
        serialNumber: e.serialNumber ?? undefined,
        approximateValueInr: e.approximateValueInr ?? undefined,
      })),
      financialAssets: (decl.financialAssets ?? []).map((f) => ({
        id: f.id,
        assetSubtype: f.assetSubtype ?? undefined,
        bankName: f.bankName ?? undefined,
        investmentType: f.investmentType ?? undefined,
        amount: f.amount ?? undefined,
        maturityDate: f.maturityDate ?? undefined,
      })),
      clarificationResponse: '',
    }
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

      {/* Site visit visibility banner */}
      {declaration.status === 'SITE_VISIT_SCHEDULED' && (
        <div className="flex items-start gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">
          <span className="mt-0.5 text-lg leading-none">📅</span>
          <div>
            <p className="font-semibold">A site visit has been scheduled by the DC.</p>
            <p className="mt-0.5 text-purple-700">Please ensure the premises are accessible. You will be contacted directly for the exact date and time.</p>
          </div>
        </div>
      )}
      {declaration.status === 'SITE_VISIT_COMPLETED' && (
        <div className="flex items-start gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          <span className="mt-0.5 text-lg leading-none">✅</span>
          <div>
            <p className="font-semibold">Site visit completed.</p>
            <p className="mt-0.5 text-indigo-700">The DC is reviewing the findings. You will be notified of the outcome.</p>
          </div>
        </div>
      )}

      {/* Download acknowledgement — visible when APPROVED */}
      {declaration.status === 'APPROVED' && declaration.acknowledgementNumber && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="text-sm text-emerald-800 font-medium flex-1">
            Acknowledgement No: <span className="font-bold">{declaration.acknowledgementNumber}</span>
          </span>
          <a
            href={`/api/v1/declarations/${declaration.id}/acknowledgement/download`}
            download={`acknowledgement-${declaration.acknowledgementNumber}.pdf`}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Download Acknowledgement
          </a>
        </div>
      )}

      {/* Withdraw button — visible to TA when status allows it */}
      {getAvailableActions(declaration.status, userRole).canWithdraw && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
              Withdraw Declaration
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Withdraw Declaration?</AlertDialogTitle>
              <AlertDialogDescription>
                This will withdraw your declaration from DC review. You can create a new draft
                if you wish to resubmit. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isWithdrawing}
                onClick={() => withdrawDeclaration(declaration.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isWithdrawing ? 'Withdrawing…' : 'Yes, withdraw'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* Show rejection alert if declaration is rejected */}
      <RejectionAlert 
        status={declaration.status} 
        declarationId={declaration.id}
        rejectionReason={declaration.rejectionReason ?? undefined}
      />

      <Tabs defaultValue="overview" className="w-full">
        <div className="rounded-lg border border-border/60 bg-card/95 p-1 shadow-sm lg:w-auto">
          <TabsList className="grid w-full grid-cols-3 gap-1 bg-transparent p-0 lg:w-auto">
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

      </Tabs>
    </div>
  )
}
