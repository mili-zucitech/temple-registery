import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  ChevronLeft, AlertTriangle, MapPin, FileText, Info, Shield, Users, Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CardSkeleton, Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { TempleGradeBadge } from '@/components/data-display/StatusBadge/TempleGradeBadge'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { ReadOnlyBanner } from '@/components/feedback/ReadOnlyBanner/ReadOnlyBanner'
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
  useUnflagTempleMutation,
} from '@/features/dc/dcApi'
import {
  useApproveTrustMutation,
  useRejectTrustMutation,
} from '@/features/governance/governanceApi'
import {
  workflowApproveSchema,
  workflowRejectSchema,
  dcClarifySchema,
  type WorkflowApproveRequest,
  type WorkflowRejectRequest,
  type DcClarifyRequest,
} from '@/features/governance/governanceTypes'
import type { TempleGrade } from '@/features/temple-profile/hooks/templeTypes'

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

  const { profile, isLoading, isError, refetch: refetchProfile } = useDcTempleProfile(id)
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
    confirmScheduleSiteVisit,
    confirmMarkUnderReview,
    isSubmitting,
  } = useWorkflowActions()

  const markedUnderReviewRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (selectedDeclarationId && selectedDeclarationDetail) {
      if (
        (selectedDeclarationDetail.status === 'SUBMITTED' || selectedDeclarationDetail.status === 'CLARIFICATION_RESPONDED') &&
        !markedUnderReviewRef.current.has(selectedDeclarationId)
      ) {
        markedUnderReviewRef.current.add(selectedDeclarationId)
        confirmMarkUnderReview(selectedDeclarationId)
      }
    }
  }, [selectedDeclarationId, selectedDeclarationDetail?.status])

  const [verifyTemple] = useVerifyTempleMutation()
  const [flagTemple] = useFlagTempleMutation()
  const [unflagTemple, { isLoading: isUnflagging }] = useUnflagTempleMutation()
  const [approveTrust, { isLoading: verifyingTrust }] = useApproveTrustMutation()
  const [rejectTrust, { isLoading: rejectingTrust }] = useRejectTrustMutation()

  const overdueDecls = useMemo(() =>
    profile?.declarations.filter((d) => d.status === 'OVERDUE') ?? [],
    [profile?.declarations]
  )
  const pendingReviewDecls = useMemo(() =>
    profile?.declarations.filter((d) => ['SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_RESPONDED'].includes(d.status)) ?? [],
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
      {(role === USER_ROLES.AUDITOR || role === USER_ROLES.VIEWER) && (
        <ReadOnlyBanner message="You are viewing this temple profile in read-only mode. Verification, flagging, and approval actions are not available." />
      )}
      {/* Tabs must wrap TabsList — so we wrap the whole content including the header */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col bg-slate-50 min-h-screen">

        {/* ── HERO CASE HEADER ─────────────────────────────────────────────── */}
        <header 
          className="relative overflow-hidden mb-0 rounded-t-xl"
          style={{
            background: 'linear-gradient(135deg, hsl(36 80% 50%), hsl(24 85% 55%))',
            boxShadow: '0 4px 20px hsl(36 80% 50% / 0.25)'
          }}
        >
          {/* Decorative background elements - matching DC Dashboard */}
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 pointer-events-none" />
          <div className="absolute right-20 -bottom-10 h-28 w-28 rounded-full bg-white/10 pointer-events-none" />

          {/* Alert Banner */}
          {(isOverdue || needsReview) && (
            <div className={cn(
              'flex items-center justify-between gap-4 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm',
              isOverdue ? 'bg-red-900/40 text-white border-b border-red-800/30' : 'bg-amber-900/30 text-white border-b border-amber-800/20',
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
                  className="bg-white/25 border border-white/30 px-4 py-1.5 rounded-lg hover:bg-white/40 transition-all font-semibold text-xs tracking-button shadow-sm"
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
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="mt-1 h-10 w-10 shrink-0 rounded-lg bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition-all"
                >
                  <ChevronLeft size={18} />
                </Button>
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl font-bold text-white leading-tight">
                      {temple.name}
                    </h1>
                    {temple.grade && <TempleGradeBadge grade={temple.grade as TempleGrade} />}
                    {verificationPosture && (
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border backdrop-blur-sm",
                        verificationPosture.label === 'High Risk' 
                          ? 'bg-red-500/20 text-white border-red-400/30'
                          : verificationPosture.label === 'Needs Attention'
                          ? 'bg-amber-500/20 text-white border-amber-400/30'
                          : 'bg-emerald-500/20 text-white border-emerald-400/30'
                      )}>
                        {verificationPosture.label}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-white/80 font-medium">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-white/60" />
                      {locationDisplay || 'Location not set'}
                    </div>
                    {temple.registrationNumber && (
                      <div className="flex items-center gap-1.5 pl-4 border-l border-white/20">
                        <FileText size={13} className="text-white/60" />
                        Reg ID: <span className="text-white font-semibold">{temple.registrationNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {temple.verificationStatus === 'FLAGGED' && canAct && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/20 bg-transparent"
                    onClick={async () => {
                      try {
                        await unflagTemple({ id }).unwrap()
                        toast.success('Temple flag removed.')
                      } catch {
                        toast.error('Failed to remove flag. Please try again.')
                      }
                    }}
                    disabled={isUnflagging}
                  >
                    {isUnflagging ? 'Removing flag…' : '🏳 Remove Flag'}
                  </Button>
                )}
              </div>
            </div>
          </div>

        </header>
        
        {/* Tab Navigation — Moved outside for sticky functionality */}
        <div 
          className="sticky top-0 z-30 shadow-lg backdrop-blur-sm"
          style={{
            background: 'rgba(30, 27, 24, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent px-6">
            <TabsList className="h-12 p-0 bg-transparent gap-1 flex w-full min-w-max">
              {(
                [
                  { v: 'overview',     label: 'Overview',      icon: <Info size={14} />, count: null },
                  { v: 'declarations', label: 'Declarations',  icon: <FileText size={14} />, count: declarations?.length ?? 0 },
                  { v: 'trust',        label: 'Trust & Board', icon: <Shield size={14} />,   count: boardMemberCount },
                  { v: 'staff',        label: 'Staff',         icon: <Users size={14} />,    count: employees?.length ?? 0 },
                  { v: 'contractors',  label: 'Contractors',   icon: <Briefcase size={14} />,count: contractors?.length ?? 0 },
                  { v: 'documents',    label: 'Documents',     icon: <FileText size={14} />, count: null },
                ] as const
              ).map((tab) => (
                <TabsTrigger
                  key={tab.v}
                  value={tab.v}
                  className={cn(
                    "relative h-12 flex items-center gap-2 px-4 text-xs font-semibold transition-all duration-200 tracking-wider whitespace-nowrap rounded-t-lg",
                    "text-slate-400 hover:text-white hover:bg-white/5",
                    "data-[state=active]:text-white shadow-none"
                  )}
                  style={activeTab === tab.v ? {
                    background: 'linear-gradient(to bottom, rgba(251, 146, 60, 0.15), rgba(249, 115, 22, 0.08))',
                    borderLeft: '1px solid rgba(251, 146, 60, 0.2)',
                    borderRight: '1px solid rgba(251, 146, 60, 0.2)',
                    borderTop: '1px solid rgba(251, 146, 60, 0.2)',
                  } : {}}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={cn(
                      "ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-all",
                      activeTab === tab.v
                        ? "bg-orange-500 text-white shadow-sm"
                        : "bg-slate-800/80 text-slate-400 border border-slate-700/50"
                    )}>
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.v && (
                    <div 
                      className="absolute bottom-0 inset-x-0 h-0.5"
                      style={{
                        background: 'linear-gradient(90deg, hsl(36 80% 50%), hsl(24 85% 55%))',
                        boxShadow: '0 0 12px rgba(251, 146, 60, 0.6)'
                      }}
                    />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* ── TAB CONTENTS ─────────────────────────────────────────────────── */}
        <div className="relative z-[1] mt-6">
          <TabsContent value="overview" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <OverviewTab
              profile={profile}
              canAct={canAct}
              pendingStaging={pendingStaging}
              onApproveProfile={async (notes) => {
                if (!pendingStaging) return
                const success = await submitApproveProfile(pendingStaging.id, id, { remarks: notes })
                if (success) refetchProfile()
              }}
              onRejectProfile={async (reason) => {
                if (!pendingStaging) return
                const success = await submitRejectProfile(pendingStaging.id, id, { reason })
                if (success) refetchProfile()
              }}
              onVerifyTemple={async (notes) => {
                await verifyTemple({ id, body: { notes } }).unwrap()
              }}
              onFlagTemple={async (reason) => {
                await flagTemple({ id, body: { reason } }).unwrap()
              }}
            />
          </TabsContent>

          <TabsContent value="declarations" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DeclarationsTab
              declarations={declarations}
              canAct={canAct}
              selectedDeclarationId={selectedDeclarationId}
              selectedDeclarationDetail={selectedDeclarationDetail}
              onSelectDeclaration={setSelectedDeclarationId}
              onApprove={(declarationId) => openDialog('approve', declarationId, id)}
              onReject={(declarationId) => openDialog('reject', declarationId, id)}
              onClarify={(declarationId) => openDialog('clarify', declarationId, id)}
              onFlagPhysical={(declarationId) => openDialog('schedule-site-visit', declarationId, id)}
            />
          </TabsContent>

          <TabsContent value="trust" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TrustTab
              trust={trust}
              boardMembers={boardMembers}
              trustFinancials={profile.trustFinancials}
              boardMeetings={profile.boardMeetings ?? []}
              canAct={canAct}
              onVerifyTrust={async (trustId, _notes) => {
                try {
                  await approveTrust(trustId).unwrap()
                  toast.success('Trust approved.')
                  refetchProfile()
                } catch {
                  toast.error('Failed to approve trust. Please try again.')
                }
              }}
              onRejectTrust={async (trustId, reason) => {
                try {
                  await rejectTrust({ trustId, body: { reason } }).unwrap()
                  toast.success('Trust rejected.')
                  refetchProfile()
                } catch {
                  toast.error('Failed to reject trust. Please try again.')
                }
              }}
            />
          </TabsContent>

          <TabsContent value="staff" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StaffTab
              employees={employees}
            />
          </TabsContent>

          <TabsContent value="contractors" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ContractorsTab
              contractors={contractors}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        open={dialog.open && dialog.kind === 'schedule-site-visit'}
        kind="schedule-site-visit"
        onClose={closeDialog}
        onSubmit={confirmScheduleSiteVisit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

type DialogKind = 'approve' | 'reject' | 'clarify' | 'schedule-site-visit'
type DialogFormPayload = WorkflowApproveRequest | WorkflowRejectRequest | DcClarifyRequest

interface WorkflowDialogProps {
  open: boolean
  kind: DialogKind
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
  isSubmitting: boolean
}

type DialogField = 'remarks' | 'message' | 'notes'
type DialogValues = { remarks: string; message: string; notes: string }

const DIALOG_META: Record<DialogKind, { title: string; description: string; field: DialogField; label: string; placeholder: string; schema: any }> = {
  approve: {
    title: 'Approve Declaration',
    description: 'This will transition the declaration to APPROVED and generate an acknowledgement number.',
    field: 'remarks',
    label: 'Notes (optional)',
    placeholder: 'Internal notes for this approval…',
    schema: workflowApproveSchema,
  },
  reject: {
    title: 'Reject Declaration',
    description: 'Rejection is irreversible. The declaration status will be permanently set to REJECTED.',
    field: 'remarks',
    label: 'Rejection remarks',
    placeholder: 'Provide the reason for rejection (min 10 characters)…',
    schema: workflowRejectSchema,
  },
  clarify: {
    title: 'Request Clarification',
    description: 'The temple authority will be notified to respond to the clarification.',
    field: 'message',
    label: 'Clarification message',
    placeholder: 'Describe what needs clarification (min 10 characters)…',
    schema: dcClarifySchema,
  },
  'schedule-site-visit': {
    title: 'Schedule Site Visit',
    description: 'Schedule a physical site visit for this declaration.',
    field: 'notes',
    label: 'Site visit notes',
    placeholder: 'Describe the reason for the site visit…',
    schema: workflowApproveSchema,
  },
}

function WorkflowDialog({ open, kind, onClose, onSubmit, isSubmitting }: WorkflowDialogProps) {
  const meta = DIALOG_META[kind]
  const form = useForm<Partial<DialogValues>>({
    resolver: zodResolver(meta.schema),
    defaultValues: { [meta.field]: '' } as Partial<DialogValues>,
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
              {/* Do NOT use AlertDialogAction here — it intercepts the click and
                  closes the dialog before the form onSubmit fires. Plain Button only. */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl font-bold px-6 bg-gradient-gold hover:scale-105 transition-transform"
              >
                {isSubmitting ? 'Submitting…' : 'Confirm Action'}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
