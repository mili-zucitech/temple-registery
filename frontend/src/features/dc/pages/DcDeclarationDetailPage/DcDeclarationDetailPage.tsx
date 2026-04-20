import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertTriangle, MessageSquare } from 'lucide-react'
import { CardSkeleton, Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/app/store'
import { USER_ROLES } from '@/constants/roles'
import { useDcDeclarationDetail, useWorkflowActions } from '@/features/dc/dcHooks'
import type { ClarificationItemResponse } from '@/features/dc/dcTypes'
import {
  workflowApproveSchema,
  workflowRejectSchema,
  dcClarifySchema,
  type WorkflowApproveRequest,
  type WorkflowRejectRequest,
  type DcClarifyRequest,
} from '@/features/dc/dcTypes'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Textarea } from '@/components/ui/textarea'
import { Check, X, HelpCircle, Clipboard } from 'lucide-react'

function formatCurrency(v: number | null | undefined): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
}

function fmt(v: number | null | undefined, unit = ''): string {
  if (v == null) return '—'
  return `${v.toLocaleString('en-IN')}${unit ? ' ' + unit : ''}`
}

// ─── DcDeclarationDetailPage ──────────────────────────────────────────────────

export function DcDeclarationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const declarationId = Number(id)

  const role = useAppSelector((s) => s.auth.currentUser?.role)
  const canAct = role === USER_ROLES.DISTRICT_COLLECTOR || role === USER_ROLES.SUPER_ADMIN

  const { declaration, isLoading, isError } = useDcDeclarationDetail(declarationId)
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
    if (declaration && (declaration.status === 'PENDING_REVIEW' || declaration.status === 'RESUBMITTED')) {
      confirmMarkUnderReview(declaration.id)
    }
  }, [declaration, confirmMarkUnderReview])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (isError || !declaration) {
    return (
      <EmptyState
        title="Declaration not found"
        description="Unable to load this declaration. It may not exist or you may not have access."
        action={{ label: 'Go back', onClick: () => navigate(-1) }}
      />
    )
  }

  const actionable = ['PENDING_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED'].includes(declaration.status)

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mt-1">
          <ChevronLeft size={16} />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">
            Declaration — FY {declaration.financialYear}
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">v{declaration.versionNumber}</span>
            <StatusBadge status={declaration.status} />
            {declaration.overdue && (
              <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium">
                <AlertTriangle size={12} aria-hidden />
                Overdue
              </span>
            )}
            {declaration.acknowledgementNumber && (
              <span className="text-xs font-mono text-muted-foreground">
                ACK: {declaration.acknowledgementNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Workflow actions */}
      {canAct && actionable && (
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => openDialog('approve', declaration.id)} className="gap-1">
            <Check size={14} /> Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={() => openDialog('reject', declaration.id)} className="gap-1">
            <X size={14} /> Reject
          </Button>
          <Button size="sm" variant="outline" onClick={() => openDialog('clarify', declaration.id)} className="gap-1">
            <HelpCircle size={14} /> Request Clarification
          </Button>
          <Button size="sm" variant="outline" onClick={() => openDialog('flag-physical', declaration.id)} className="gap-1">
            <Clipboard size={14} /> Flag Physical Verification
          </Button>
        </div>
      )}

      {/* Immovable assets */}
      <section className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/20">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-5">
          <span className="p-1.5 rounded-md bg-primary/10 text-primary">
            <Check size={16} aria-hidden />
          </span>
          Immovable Assets
        </h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex flex-col gap-1 p-4 rounded-lg bg-card border shadow-sm hover:-translate-y-[2px] transition-transform">
            <dt className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">Agricultural Land</dt>
            <dd className="text-lg font-bold text-foreground mt-1">{fmt(declaration.agriculturalLandAcres, 'acres')}</dd>
            <dd className="text-xs text-muted-foreground font-medium">{formatCurrency(declaration.agriculturalLandValue)}</dd>
          </div>
          <div className="flex flex-col gap-1 p-4 rounded-lg bg-card border shadow-sm hover:-translate-y-[2px] transition-transform">
            <dt className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">Buildings</dt>
            <dd className="text-lg font-bold text-foreground mt-1">{fmt(declaration.buildingsSqft, 'sq ft')}</dd>
            <dd className="text-xs text-muted-foreground font-medium">{formatCurrency(declaration.buildingsValue)}</dd>
          </div>
          <div className="flex flex-col gap-1 p-4 rounded-lg bg-card border shadow-sm hover:-translate-y-[2px] transition-transform">
            <dt className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">Leased Properties</dt>
            <dd className="text-lg font-bold text-foreground mt-1">{fmt(declaration.leasedPropertiesCount)}</dd>
            <dd className="text-xs text-muted-foreground font-medium">{formatCurrency(declaration.leasedPropertiesValue)}</dd>
          </div>
          <div className="flex flex-col gap-1 p-4 rounded-lg bg-card border shadow-sm hover:-translate-y-[2px] transition-transform">
            <dt className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">Other Land / Plots</dt>
            <dd className="text-lg font-bold text-foreground mt-1">—</dd>
            <dd className="text-xs text-muted-foreground font-medium">{formatCurrency(declaration.otherLandValue)}</dd>
          </div>
        </dl>
      </section>

      {/* Movable assets */}
      <section className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/20">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-5">
          <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-500">
            <Check size={16} aria-hidden />
          </span>
          Movable Assets
        </h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 text-sm">
          <div className="flex flex-col gap-1 p-4 rounded-lg bg-card border shadow-sm hover:-translate-y-[2px] transition-transform">
            <dt className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">Gold</dt>
            <dd className="text-xl font-bold text-foreground mt-1">{fmt(declaration.goldGrams, 'g')}</dd>
          </div>
          <div className="flex flex-col gap-1 p-4 rounded-lg bg-card border shadow-sm hover:-translate-y-[2px] transition-transform">
            <dt className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">Silver</dt>
            <dd className="text-xl font-bold text-foreground mt-1">{fmt(declaration.silverGrams, 'g')}</dd>
          </div>
          <div className="flex flex-col gap-1 p-4 rounded-lg bg-card border shadow-sm hover:-translate-y-[2px] transition-transform">
            <dt className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">Idols</dt>
            <dd className="text-xl font-bold text-foreground mt-1">{fmt(declaration.idolsCount)}</dd>
          </div>
          <div className="flex flex-col gap-1 p-4 rounded-lg bg-card border shadow-sm hover:-translate-y-[2px] transition-transform">
            <dt className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">Vehicles</dt>
            <dd className="text-xl font-bold text-foreground mt-1">{fmt(declaration.vehiclesCount)}</dd>
          </div>
          <div className="flex flex-col gap-1 p-4 rounded-lg bg-card border shadow-sm hover:-translate-y-[2px] transition-transform">
            <dt className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">Financial</dt>
            <dd className="text-base font-bold text-foreground mt-1 truncate">{formatCurrency(declaration.financialAssetsValue)}</dd>
          </div>
          <div className="flex flex-col gap-1 p-4 rounded-lg bg-card border shadow-sm hover:-translate-y-[2px] transition-transform">
            <dt className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">Other</dt>
            <dd className="text-base font-bold text-foreground mt-1 truncate">{formatCurrency(declaration.otherMovableValue)}</dd>
          </div>
        </dl>
      </section>

      {/* Dates */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Timeline</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Submitted</dt>
            <dd>{declaration.submittedAt ? new Date(declaration.submittedAt).toLocaleDateString() : '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Due Date</dt>
            <dd className={declaration.overdue ? 'text-destructive font-medium' : ''}>
              {declaration.dueDate ? new Date(declaration.dueDate).toLocaleDateString() : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Reviewed</dt>
            <dd>{declaration.reviewedAt ? new Date(declaration.reviewedAt).toLocaleDateString() : '—'}</dd>
          </div>
        </dl>
      </section>

      {/* Clarification history */}
      {declaration.clarifications.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <MessageSquare size={14} aria-hidden />
            Clarification History ({declaration.clarifications.length})
          </h2>
          {declaration.clarifications.map((item: ClarificationItemResponse) => (
            <div
              key={item.id}
              className={`rounded-md px-3 py-2.5 text-sm ${
                item.direction === 'DC_TO_TA'
                  ? 'bg-primary/5 border border-primary/20 ml-6'
                  : 'bg-muted/50 border border-border mr-6'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {item.direction === 'DC_TO_TA' ? 'DC → Temple Authority' : 'Temple Authority → DC'}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">{item.notes}</p>
            </div>
          ))}
        </section>
      )}

      {/* Workflow dialogs */}
      <WorkflowDialog open={dialog.open && dialog.kind === 'approve'} kind="approve" onClose={closeDialog} onSubmit={confirmApprove} isSubmitting={isSubmitting} />
      <WorkflowDialog open={dialog.open && dialog.kind === 'reject'} kind="reject" onClose={closeDialog} onSubmit={confirmReject} isSubmitting={isSubmitting} />
      <WorkflowDialog open={dialog.open && dialog.kind === 'clarify'} kind="clarify" onClose={closeDialog} onSubmit={confirmClarify} isSubmitting={isSubmitting} />
      <WorkflowDialog open={dialog.open && dialog.kind === 'flag-physical'} kind="flag-physical" onClose={closeDialog} onSubmit={confirmFlagPhysical} isSubmitting={isSubmitting} />
    </div>
  )
}

// ─── WorkflowDialog (inline) ──────────────────────────────────────────────────

type DialogKind = 'approve' | 'reject' | 'clarify' | 'flag-physical'
type DialogFormPayload = WorkflowApproveRequest | WorkflowRejectRequest | DcClarifyRequest
type FieldKey = 'notes' | 'reason'

const DIALOG_META: Record<DialogKind, {
  title: string
  description: string
  field: FieldKey
  label: string
  placeholder: string
  required: boolean
  schema: typeof workflowApproveSchema | typeof workflowRejectSchema | typeof dcClarifySchema
}> = {
  approve: {
    title: 'Approve Declaration',
    description: 'This will transition the declaration to APPROVED and generate an acknowledgement number.',
    field: 'notes', label: 'Notes (optional)', placeholder: 'Internal notes for this approval…',
    required: false, schema: workflowApproveSchema,
  },
  reject: {
    title: 'Reject Declaration',
    description: 'Rejection is irreversible. The declaration status will be permanently set to REJECTED.',
    field: 'reason', label: 'Rejection reason', placeholder: 'Provide the reason for rejection…',
    required: true, schema: workflowRejectSchema,
  },
  clarify: {
    title: 'Request Clarification',
    description: 'The temple authority will be notified to respond to the clarification.',
    field: 'notes', label: 'Clarification notes', placeholder: 'Describe what needs clarification…',
    required: true, schema: dcClarifySchema,
  },
  'flag-physical': {
    title: 'Flag Physical Verification',
    description: 'This declaration will be flagged for a physical inspection before further processing.',
    field: 'notes', label: 'Verification notes', placeholder: 'Describe the reason for physical verification…',
    required: true, schema: dcClarifySchema,
  },
}

interface WorkflowDialogProps {
  open: boolean
  kind: DialogKind
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
  isSubmitting: boolean
}

function WorkflowDialog({ open, kind, onClose, onSubmit, isSubmitting }: WorkflowDialogProps) {
  const meta = DIALOG_META[kind]

  const form = useForm<{ [key in FieldKey]?: string }>({
    resolver: zodResolver(meta.schema),
    defaultValues: { [meta.field]: '' } as { [key in FieldKey]?: string },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values as DialogFormPayload)
    form.reset()
  })

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{meta.title}</AlertDialogTitle>
          <AlertDialogDescription>{meta.description}</AlertDialogDescription>
        </AlertDialogHeader>

        {kind === 'reject' && (
          <div className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive" role="alert">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" aria-hidden />
            <p>
              Rejecting will require the temple authority to submit a <strong>new declaration</strong> for this financial year. This action cannot be undone.
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name={meta.field as FieldKey}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{meta.label}</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ''} placeholder={meta.placeholder} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={onClose} type="button">Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting…' : 'Confirm'}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
