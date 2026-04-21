import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronLeft, AlertTriangle, MapPin, FileText, Info, Shield, Users, Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CardSkeleton, Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { TempleGradeBadge } from '@/components/data-display/StatusBadge/TempleGradeBadge'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAppSelector } from '@/app/store'
import { USER_ROLES } from '@/constants/roles'
import {
  useDcTempleProfile,
  useDcDeclarationDetail,
  useWorkflowActions,
  useDcPendingProfileStaging,
  useProfileWorkflowActions,
} from '@/features/dc/dcHooks'
import {
  useVerifyTempleMutation,
  useFlagTempleMutation,
  useVerifyTrustMutation,
  useFlagTrustMutation,
  useVerifyStaffModuleMutation,
  useFlagStaffModuleMutation,
  useVerifyContractorsModuleMutation,
  useFlagContractorsModuleMutation,
} from '@/features/dc/dcApi'
import {
  workflowApproveSchema,
  workflowRejectSchema,
  dcClarifySchema,
  type WorkflowApproveRequest,
  type WorkflowRejectRequest,
  type DcClarifyRequest,
} from '@/features/dc/dcTypes'
import type { TempleGrade } from '@/features/temple/templeTypes'

import {
  OverviewTab,
  DeclarationsTab,
  TrustTab,
  StaffTab,
  ContractorsTab,
  DocumentsTab
} from './tabs'

export function DcTempleProfilePage() {
  const { templeId } = useParams<{ templeId: string }>()
  const navigate = useNavigate()
  const id = Number(templeId)

  const role = useAppSelector((s) => s.auth.currentUser?.role)
  const canAct =
    role === USER_ROLES.DISTRICT_COLLECTOR || role === USER_ROLES.SUPER_ADMIN

  const { profile, isLoading, isError } = useDcTempleProfile(id)
  const { pendingStaging } = useDcPendingProfileStaging(id)
  const { submitApproveProfile, submitRejectProfile } = useProfileWorkflowActions()

  const [selectedDeclarationId, setSelectedDeclarationId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const { declaration: selectedDeclarationDetail } = useDcDeclarationDetail(selectedDeclarationId ?? 0)

  const {
    dialog,
    openDialog,
    closeDialog,
    confirmApprove,
    confirmReject,
    confirmClarify,
    confirmFlagPhysical,
    confirmMarkUnderReview,
    isSubmitting,
  } = useWorkflowActions()

  useEffect(() => {
    if (selectedDeclarationId && selectedDeclarationDetail) {
      if (selectedDeclarationDetail.status === 'PENDING_REVIEW' || selectedDeclarationDetail.status === 'RESUBMITTED') {
        confirmMarkUnderReview(selectedDeclarationId)
      }
    }
  }, [selectedDeclarationId, selectedDeclarationDetail, confirmMarkUnderReview])

  const [verifyTemple] = useVerifyTempleMutation()
  const [flagTemple] = useFlagTempleMutation()
  const [verifyTrust] = useVerifyTrustMutation()
  const [flagTrust] = useFlagTrustMutation()
  const [verifyStaffModule] = useVerifyStaffModuleMutation()
  const [flagStaffModule] = useFlagStaffModuleMutation()
  const [verifyContractorsModule] = useVerifyContractorsModuleMutation()
  const [flagContractorsModule] = useFlagContractorsModuleMutation()

  const overdueDecls = useMemo(() =>
    profile?.declarations.filter((d) => d.status === 'OVERDUE') ?? [],
    [profile?.declarations]
  )
  const pendingReviewDecls = useMemo(() =>
    profile?.declarations.filter((d) => ['PENDING_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED'].includes(d.status)) ?? [],
    [profile?.declarations]
  )
  const isOverdue = overdueDecls.length > 0
  const needsReview = pendingReviewDecls.length > 0

  const locationDisplay = useMemo(() =>
    [profile?.districtName, profile?.talukName, profile?.hobliName].filter(Boolean).join(' › '),
    [profile?.districtName, profile?.talukName, profile?.hobliName]
  )

  const verificationPosture = useMemo(() => {
    if (!profile) return null
    const { temple } = profile
    if (isOverdue || temple.verificationStatus === 'FLAGGED') {
      return { label: 'High Risk', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
    }
    if (needsReview || temple.verificationStatus === 'UNVERIFIED') {
      return { label: 'Needs Attention', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
    }
    return { label: 'Verified', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
  }, [profile, isOverdue, needsReview])

  // Module-level status summary removed — status is shown inside each tab, not in the header

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <CardSkeleton />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <EmptyState
          title="Temple not found"
          description="Unable to load temple profile. It may not exist or you may not have access."
          action={{ label: 'Go back', onClick: () => navigate(-1) }}
        />
      </div>
    )
  }

  const { temple, declarations, boardMembers, employees, contractors, trust } = profile
  const boardMemberCount = (boardMembers?.current?.length ?? 0) + (boardMembers?.past?.length ?? 0)

  return (
    <div className="animate-in fade-in duration-500">
      {/* Tabs must wrap TabsList — so we wrap the whole content including the header */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col bg-slate-50 min-h-screen">

        {/* ── HERO CASE HEADER ─────────────────────────────────────────────── */}
        <header className="relative bg-slate-900 border-b border-slate-800 shadow-sm mb-0">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl opacity-20" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl opacity-20" />

          {/* Alert Banner */}
          {(isOverdue || needsReview) && (
            <div className={cn(
              'flex items-center justify-between gap-4 px-6 py-3 text-xs font-medium uppercase tracking-label',
              isOverdue ? 'bg-destructive/90 text-white' : 'bg-amber-500/90 text-white',
            )} role="alert">
              <span className="flex items-center gap-2">
                <AlertTriangle size={14} aria-hidden />
                {isOverdue
                  ? `${overdueDecls.length} declaration${overdueDecls.length > 1 ? 's' : ''} overdue — immediate action required`
                  : `${pendingReviewDecls.length} declaration${pendingReviewDecls.length > 1 ? 's' : ''} awaiting review`}
              </span>
              {canAct && (
                <button
                  onClick={() => setActiveTab('declarations')}
                  className="bg-white/20 px-4 py-1.5 rounded-lg hover:bg-white/30 transition-all font-medium text-xs tracking-button"
                >
                  {isOverdue ? 'ACT NOW' : 'REVIEW'}
                </button>
              )}
            </div>
          )}

          {/* Main Header Content */}
          <div className="relative z-10 px-6 py-5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4 min-w-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="mt-1 h-10 w-10 shrink-0 rounded-xl border-border/50 bg-white/5 hover:bg-white/10 text-white border-white/10 transition-all"
                >
                  <ChevronLeft size={18} />
                </Button>
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl font-bold tracking-title text-white">
                      {temple.name}
                    </h1>
                    {temple.grade && <TempleGradeBadge grade={temple.grade as TempleGrade} />}
                    {verificationPosture && (
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium uppercase tracking-label border",
                        verificationPosture.color
                      )}>
                        {verificationPosture.label}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-white/60 font-regular">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-white/40" />
                      {locationDisplay || 'Location not set'}
                    </div>
                    {temple.registrationNumber && (
                      <div className="flex items-center gap-1.5 pl-4 border-l border-white/10">
                        <FileText size={13} className="text-white/40" />
                        Reg ID: <span className="text-white font-medium">{temple.registrationNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Temple verify/flag actions are in the Overview tab — not duplicated here */}
              </div>
            </div>
          </div>

        </header>
        
        {/* Tab Navigation — Moved outside for sticky functionality */}
        <div className="sticky top-0 z-30 border-t border-slate-800 px-6 bg-slate-900 shadow-md rounded-b-2xl">
          <TabsList className="h-14 p-0 bg-transparent gap-1 overflow-x-auto flex w-full no-scrollbar">
            {(
              [
                { v: 'overview',     label: 'Overview',      icon: <Info size={15} />, count: null },
                { v: 'declarations', label: 'Declarations',  icon: <FileText size={15} />, count: declarations?.length ?? 0 },
                { v: 'trust',        label: 'Trust & Board', icon: <Shield size={15} />,   count: boardMemberCount },
                { v: 'staff',        label: 'Staff',         icon: <Users size={15} />,    count: employees?.length ?? 0 },
                { v: 'contractors',  label: 'Contractors',   icon: <Briefcase size={15} />,count: contractors?.length ?? 0 },
                { v: 'documents',    label: 'Documents',     icon: <FileText size={15} />, count: null },
              ] as const
            ).map((tab) => (
              <TabsTrigger
                key={tab.v}
                value={tab.v}
                className={cn(
                  "relative h-14 flex items-center gap-2 px-5 text-xs font-medium transition-all duration-200 tracking-button",
                  "text-slate-400 hover:text-white hover:bg-slate-800/50",
                  "data-[state=active]:text-white data-[state=active]:bg-slate-800/80 shadow-none"
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className={cn(
                    "ml-1 text-xs font-medium px-2 py-0.5 rounded-full transition-all tracking-label",
                    activeTab === tab.v
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  )}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.v && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-amber-500 rounded-t-full shadow-[0_-2px_8px_rgba(245,158,11,0.3)]" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── TAB CONTENTS ─────────────────────────────────────────────────── */}
        <div className="relative z-[1] mt-6">
          <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
            <OverviewTab
              profile={profile}
              pendingStaging={pendingStaging}
              canAct={canAct}
              onVerifyTemple={async (notes) => { await verifyTemple({ id, body: { notes } }).unwrap() }}
              onFlagTemple={async (reason) => { await flagTemple({ id, body: { reason } }).unwrap() }}
              onApproveProfile={(stagingId) => {
                if (window.confirm('Approve this profile update?')) {
                  submitApproveProfile(stagingId, id, { notes: 'Approved via DC Portal' })
                }
              }}
              onRejectProfile={(stagingId) => {
                const reason = window.prompt('Rejection reason (min 1 character):')
                if (reason) {
                  submitRejectProfile(stagingId, id, { reason })
                }
              }}
            />
          </TabsContent>

          <TabsContent value="declarations" className="mt-0 focus-visible:outline-none">
            <DeclarationsTab
              declarations={declarations}
              canAct={canAct}
              selectedDeclarationId={selectedDeclarationId}
              selectedDeclarationDetail={selectedDeclarationDetail}
              onSelectDeclaration={setSelectedDeclarationId}
              onApprove={(declarationId) => openDialog('approve', declarationId)}
              onReject={(declarationId) => openDialog('reject', declarationId)}
              onClarify={(declarationId) => openDialog('clarify', declarationId)}
              onFlagPhysical={(declarationId) => openDialog('flag-physical', declarationId)}
            />
          </TabsContent>

          <TabsContent value="trust" className="mt-0 focus-visible:outline-none">
            <TrustTab
              trust={trust}
              boardMembers={boardMembers}
              trustFinancials={profile.trustFinancials}
              canAct={canAct}
              onVerifyTrust={async (trustId, notes) => { await verifyTrust({ id: trustId, templeId: id, body: { notes } }).unwrap() }}
              onFlagTrust={async (trustId, reason) => { await flagTrust({ id: trustId, templeId: id, body: { reason } }).unwrap() }}
            />
          </TabsContent>

          <TabsContent value="staff" className="mt-0 focus-visible:outline-none">
            <StaffTab
              employees={employees}
              canAct={canAct}
              templeId={id}
              onVerifyStaff={async (notes) => {
                await verifyStaffModule({ templeId: id, body: { notes } }).unwrap()
              }}
              onFlagStaff={async (reason) => {
                await flagStaffModule({ templeId: id, body: { reason } }).unwrap()
              }}
            />
          </TabsContent>

          <TabsContent value="contractors" className="mt-0 focus-visible:outline-none">
            <ContractorsTab
              contractors={contractors}
              canAct={canAct}
              templeId={id}
              onVerifyContractors={async (notes) => {
                await verifyContractorsModule({ templeId: id, body: { notes } }).unwrap()
              }}
              onFlagContractors={async (reason) => {
                await flagContractorsModule({ templeId: id, body: { reason } }).unwrap()
              }}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-0 focus-visible:outline-none">
            <DocumentsTab templeId={id} />
          </TabsContent>
        </div>
      </Tabs>

      {/* ── WORKFLOW DIALOGS ─────────────────────────────────────────────── */}
      <WorkflowDialog
        open={dialog.open && dialog.kind === 'approve'}
        kind="approve"
        onClose={closeDialog}
        onSubmit={confirmApprove}
        isSubmitting={isSubmitting}
      />
      <WorkflowDialog
        open={dialog.open && dialog.kind === 'reject'}
        kind="reject"
        onClose={closeDialog}
        onSubmit={confirmReject}
        isSubmitting={isSubmitting}
      />
      <WorkflowDialog
        open={dialog.open && dialog.kind === 'clarify'}
        kind="clarify"
        onClose={closeDialog}
        onSubmit={confirmClarify}
        isSubmitting={isSubmitting}
      />
      <WorkflowDialog
        open={dialog.open && dialog.kind === 'flag-physical'}
        kind="flag-physical"
        onClose={closeDialog}
        onSubmit={confirmFlagPhysical}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

type DialogKind = 'approve' | 'reject' | 'clarify' | 'flag-physical'
type DialogFormPayload = WorkflowApproveRequest | WorkflowRejectRequest | DcClarifyRequest

interface WorkflowDialogProps {
  open: boolean
  kind: DialogKind
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
  isSubmitting: boolean
}

const DIALOG_META: Record<DialogKind, any> = {
  approve: {
    title: 'Approve Declaration',
    description: 'This will transition the declaration to APPROVED and generate an acknowledgement number.',
    field: 'notes',
    label: 'Notes (optional)',
    placeholder: 'Internal notes for this approval…',
    schema: workflowApproveSchema,
  },
  reject: {
    title: 'Reject Declaration',
    description: 'Rejection is irreversible. The declaration status will be permanently set to REJECTED.',
    field: 'reason',
    label: 'Rejection reason',
    placeholder: 'Provide the reason for rejection…',
    schema: workflowRejectSchema,
  },
  clarify: {
    title: 'Request Clarification',
    description: 'The temple authority will be notified to respond to the clarification.',
    field: 'notes',
    label: 'Clarification notes',
    placeholder: 'Describe what needs clarification…',
    schema: dcClarifySchema,
  },
  'flag-physical': {
    title: 'Flag Physical Verification',
    description: 'This temple will be flagged for a physical inspection before further processing.',
    field: 'notes',
    label: 'Verification notes',
    placeholder: 'Describe the reason for physical verification…',
    schema: dcClarifySchema,
  },
}

function WorkflowDialog({ open, kind, onClose, onSubmit, isSubmitting }: WorkflowDialogProps) {
  const meta = DIALOG_META[kind]
  const form = useForm({
    resolver: zodResolver(meta.schema),
    defaultValues: { [meta.field]: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values as DialogFormPayload)
    form.reset()
  })

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="rounded-2xl border-border/50 shadow-soft-lg animate-in zoom-in-95 duration-300">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-display font-bold">{meta.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">{meta.description}</AlertDialogDescription>
        </AlertDialogHeader>
        {kind === 'reject' && (
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive" role="alert">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden />
            <p className="font-medium">This action is irreversible. Rejecting will require the temple authority to submit a new declaration.</p>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name={meta.field}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{meta.label}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={meta.placeholder} className="rounded-xl border-border/50 bg-card/50" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={onClose} type="button" className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold px-6 bg-gradient-gold hover:scale-105 transition-transform">
                  {isSubmitting ? 'Submitting…' : 'Confirm Action'}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
