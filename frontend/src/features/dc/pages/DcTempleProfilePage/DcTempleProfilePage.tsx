import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, Check, X, HelpCircle, Clipboard } from 'lucide-react'
import { CardSkeleton, Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppSelector } from '@/app/store'
import { USER_ROLES } from '@/constants/roles'
import { ROUTE_PATHS } from '@/constants/routePaths'
import {
  useDcTempleProfile,
  useWorkflowActions,
} from '@/features/dc/dcHooks'
import {
  useApproveTrustMutation,
  useRejectTrustMutation,
  useApproveBoardMemberMutation,
  useRejectBoardMemberMutation,
} from '@/features/dc/dcApi'
import {
  workflowApproveSchema,
  workflowRejectSchema,
  dcClarifySchema,
  type WorkflowApproveRequest,
  type WorkflowRejectRequest,
  type DcClarifyRequest,
  type DeclarationSummary,
} from '@/features/dc/dcTypes'
import { toast } from 'sonner'


export function DcTempleProfilePage() {
  const { templeId } = useParams<{ templeId: string }>()
  const navigate = useNavigate()
  const id = Number(templeId)

  const role = useAppSelector((s) => s.auth.currentUser?.role)
  const canAct =
    role === USER_ROLES.DISTRICT_COLLECTOR || role === USER_ROLES.SUPER_ADMIN

  const { profile, isLoading, isError } = useDcTempleProfile(id)
  const [selectedDeclarationId, setSelectedDeclarationId] = useState<number | null>(null)

  const {
    dialog,
    openDialog,
    closeDialog,
    confirmApprove,
    confirmReject,
    confirmClarify,
    confirmFlagPhysical,
    isSubmitting,
  } = useWorkflowActions()

  const [approveTrust, { isLoading: isApprovingTrust }] = useApproveTrustMutation()
  const [rejectTrust, { isLoading: isRejectingTrust }] = useRejectTrustMutation()
  const [approveBoardMember, { isLoading: isApprovingMember }] = useApproveBoardMemberMutation()
  const [rejectBoardMember, { isLoading: isRejectingMember }] = useRejectBoardMemberMutation()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <EmptyState
        title="Temple not found"
        description="Unable to load temple profile. It may not exist or you may not have access."
        action={{ label: 'Go back', onClick: () => navigate(-1) }}
      />
    )
  }

  const { temple, trust, boardMembers, employees, contractors, declarations } = profile

  const handleApproveTrust = async () => {
    if (!trust?.id) return
    try {
      await approveTrust({ trustId: trust.id }).unwrap()
      toast.success('Trust approved successfully')
    } catch {
      toast.error('Failed to approve trust')
    }
  }

  const handleRejectTrust = async () => {
    if (!trust?.id) return
    const reason = window.prompt('Enter rejection reason for the trust (minimum 10 characters):')
    if (!reason || reason.length < 10) {
      if (reason) toast.error('Reason must be at least 10 characters long.')
      return
    }
    try {
      await rejectTrust({ trustId: trust.id, body: { remarks: reason } }).unwrap()
      toast.success('Trust rejected successfully')
    } catch {
      toast.error('Failed to reject trust')
    }
  }

  const handleApproveMember = async (memberId: number) => {
    try {
      await approveBoardMember({ memberId }).unwrap()
      toast.success('Board member approved successfully')
    } catch {
      toast.error('Failed to approve board member')
    }
  }

  const handleRejectMember = async (memberId: number) => {
    const reason = window.prompt('Enter rejection reason for this board member (minimum 10 characters):')
    if (!reason || reason.length < 10) {
      if (reason) toast.error('Reason must be at least 10 characters long.')
      return
    }
    try {
      await rejectBoardMember({ memberId, body: { remarks: reason } }).unwrap()
      toast.success('Board member rejected successfully')
    } catch {
      toast.error('Failed to reject board member')
    }
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTE_PATHS.DC_TEMPLES)} className="mt-1">
          <ChevronLeft size={16} />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{temple.name}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">Grade {temple.grade}</span>
            <span className="text-xs text-muted-foreground">{profile.districtName ?? ''}</span>
            {temple.assetDeclarationStatus && (
              <StatusBadge status={temple.assetDeclarationStatus} />
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="declarations">
            Declarations {declarations.length > 0 && `(${declarations.length})`}
          </TabsTrigger>
          <TabsTrigger value="trust">Trust & Board</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        {/* ── Overview tab ── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Core details */}
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Temple Details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <DetailItem label="Tradition" value={temple.tradition} />
              <DetailItem label="Trust Registered" value={temple.trustRegistered ? 'Yes' : 'No'} />
              <DetailItem label="District" value={profile.districtName} />
              <DetailItem label="Taluk" value={profile.talukName} />
              <DetailItem label="Hobli" value={profile.hobliName} />
              <DetailItem label="City" value={profile.cityName} />
              <DetailItem label="Address" value={temple.addressLine1} />
              <DetailItem label="Pin Code" value={temple.pinCode} />
              <DetailItem label="Contact Name" value={temple.contactName} />
              <DetailItem label="Contact Phone" value={temple.contactPhone} />
              <DetailItem label="Contact Email" value={temple.contactEmail} />
            </dl>
          </section>

          {/* Trust financials summary */}
          {profile.trustFinancials.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Trust Financials</h2>
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="py-2 text-left font-semibold text-muted-foreground">FY</th>
                    <th className="py-2 text-right font-semibold text-muted-foreground">Income</th>
                    <th className="py-2 text-right font-semibold text-muted-foreground">Expenditure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {profile.trustFinancials.map((f) => (
                    <tr key={f.financialYear}>
                      <td className="py-2">{f.financialYear}</td>
                      <td className="py-2 text-right">{formatCurrency(f.annualIncome)}</td>
                      <td className="py-2 text-right">{formatCurrency(f.expenditure)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </TabsContent>

        {/* ── Declarations tab ── */}
        <TabsContent value="declarations" className="mt-4 space-y-4">
          {declarations.length === 0 ? (
            <EmptyState title="No declarations" description="This temple has not submitted any declarations." />
          ) : (
            declarations.map((dec) => (
              <DeclarationCard
                key={dec.id}
                declaration={dec}
                canAct={canAct}
                isSelected={selectedDeclarationId === dec.id}
                onSelect={() =>
                  setSelectedDeclarationId(selectedDeclarationId === dec.id ? null : dec.id)
                }
                onApprove={() => openDialog('approve', dec.id)}
                onReject={() => openDialog('reject', dec.id)}
                onClarify={() => openDialog('clarify', dec.id)}
                onFlagPhysical={() => openDialog('flag-physical', dec.id)}
              />
            ))
          )}
        </TabsContent>

        {/* ── Trust & Board tab ── */}
        <TabsContent value="trust" className="mt-4 space-y-6">
          {trust ? (
            <section className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Trust Registration</h2>
                {canAct && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleApproveTrust} disabled={isApprovingTrust} className="gap-1">
                      <Check size={14} /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleRejectTrust} disabled={isRejectingTrust} className="gap-1">
                      <X size={14} /> Reject
                    </Button>
                  </div>
                )}
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <DetailItem label="Trust Name" value={trust.trustName} />
                <DetailItem label="Status" value={trust.status} />
                <DetailItem label="Registration No." value={trust.registrationNumber} />
                <DetailItem label="Date of Registration" value={trust.registrationDate} />
                <DetailItem label="PAN (masked)" value={trust.panNumberMasked} />
              </dl>
            </section>
          ) : (
            <EmptyState title="No trust registered" description="This temple has no trust registration on record." />
          )}

          {boardMembers.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Board Members</h2>
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="py-2 text-left font-semibold text-muted-foreground">Name</th>
                    <th className="py-2 text-left font-semibold text-muted-foreground">Role</th>
                    <th className="py-2 text-left font-semibold text-muted-foreground hidden sm:table-cell">Phone</th>
                    <th className="py-2 text-left font-semibold text-muted-foreground hidden md:table-cell">Aadhaar</th>
                    {canAct && <th className="py-2 text-right font-semibold text-muted-foreground">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {boardMembers.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 font-medium">{m.name}</td>
                      <td className="py-2 text-muted-foreground">{m.role}</td>
                      <td className="py-2 hidden sm:table-cell">{m.phone ?? '—'}</td>
                      <td className="py-2 hidden md:table-cell text-muted-foreground font-mono text-xs">
                        {m.aadhaarMasked ?? '—'}
                      </td>
                      {canAct && (
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-success hover:text-success hover:bg-success/10" onClick={() => handleApproveMember(m.id)} disabled={isApprovingMember}>
                              <Check size={14} />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRejectMember(m.id)} disabled={isRejectingMember}>
                              <X size={14} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </TabsContent>

        {/* ── Staff tab ── */}
        <TabsContent value="staff" className="mt-4 space-y-6">
          {employees.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                Employees ({employees.length})
              </h2>
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="py-2 text-left font-semibold text-muted-foreground">Name</th>
                    <th className="py-2 text-left font-semibold text-muted-foreground">Designation</th>
                    <th className="py-2 text-left font-semibold text-muted-foreground hidden sm:table-cell">Type</th>
                    <th className="py-2 text-left font-semibold text-muted-foreground hidden md:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employees.map((e) => (
                    <tr key={e.id}>
                      <td className="py-2 font-medium">{e.name}</td>
                      <td className="py-2">{e.designation}</td>
                      <td className="py-2 hidden sm:table-cell text-muted-foreground">{e.employmentType}</td>
                      <td className="py-2 hidden md:table-cell text-muted-foreground">
                        {e.joiningDate ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {contractors.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                Contractors ({contractors.length})
              </h2>
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="py-2 text-left font-semibold text-muted-foreground">Name</th>
                    <th className="py-2 text-left font-semibold text-muted-foreground">Service</th>
                    <th className="py-2 text-left font-semibold text-muted-foreground hidden sm:table-cell">Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contractors.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 font-medium">{c.contractorName}</td>
                      <td className="py-2">{c.serviceType}</td>
                      <td className="py-2 hidden sm:table-cell text-muted-foreground text-xs">
                        {c.contractStartDate ?? '—'} → {c.contractEndDate ?? 'ongoing'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {employees.length === 0 && contractors.length === 0 && (
            <EmptyState title="No staff records" description="No employees or contractors on record for this temple." />
          )}
        </TabsContent>
      </Tabs>

      {/* ── Workflow action dialogs ── */}
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

// ─── DeclarationCard ──────────────────────────────────────────────────────────

interface DeclarationCardProps {
  declaration: DeclarationSummary
  canAct: boolean
  isSelected: boolean
  onSelect: () => void
  onApprove: () => void
  onReject: () => void
  onClarify: () => void
  onFlagPhysical: () => void
}

function DeclarationCard({
  declaration,
  canAct,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onClarify,
  onFlagPhysical,
}: DeclarationCardProps) {
  const actionable = declaration.status === 'PENDING_REVIEW'

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header row */}
      <div
        className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onSelect}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-foreground">FY {declaration.financialYear}</span>
            <span className="text-xs text-muted-foreground">v{declaration.versionNumber}</span>
            <StatusBadge status={declaration.status} />
          </div>
          {declaration.acknowledgementNumber && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              ACK: {declaration.acknowledgementNumber}
            </p>
          )}
        </div>
        <div className="text-xs text-muted-foreground flex-shrink-0">
          {declaration.submittedAt
            ? new Date(declaration.submittedAt).toLocaleDateString()
            : 'Not submitted'}
        </div>
      </div>

      {/* RBAC-gated action bar — only for actionable declarations */}
      {canAct && actionable && isSelected && (
        <div className="border-t border-border bg-muted/30 px-5 py-3 flex gap-2 flex-wrap">
          <Button size="sm" onClick={onApprove} className="gap-1">
            <Check size={14} />
            Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={onReject} className="gap-1">
            <X size={14} />
            Reject
          </Button>
          <Button size="sm" variant="outline" onClick={onClarify} className="gap-1">
            <HelpCircle size={14} />
            Request Clarification
          </Button>
          <Button size="sm" variant="outline" onClick={onFlagPhysical} className="gap-1">
            <Clipboard size={14} />
            Flag Physical Verification
          </Button>
        </div>
      )}

      {/* Read-only notice for DC_STAFF */}
      {!canAct && actionable && isSelected && (
        <div className="border-t border-border bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
          You have read-only access. Only District Collectors can take workflow actions.
        </div>
      )}
    </div>
  )
}

// ─── WorkflowDialog ───────────────────────────────────────────────────────────

type DialogKind = 'approve' | 'reject' | 'clarify' | 'flag-physical'

type DialogFormPayload = WorkflowApproveRequest | WorkflowRejectRequest | DcClarifyRequest

interface WorkflowDialogProps {
  open: boolean
  kind: DialogKind
  onClose: () => void
  onSubmit: (payload: any) => Promise<void>
  isSubmitting: boolean
}

const DIALOG_META: Record<
  DialogKind,
  { title: string; description: string; field: string; label: string; placeholder: string; required: boolean; schema: typeof workflowApproveSchema | typeof workflowRejectSchema | typeof dcClarifySchema }
> = {
  approve: {
    title: 'Approve Declaration',
    description: 'This will transition the declaration to APPROVED and generate an acknowledgement number.',
    field: 'notes',
    label: 'Notes (optional)',
    placeholder: 'Internal notes for this approval…',
    required: false,
    schema: workflowApproveSchema,
  },
  reject: {
    title: 'Reject Declaration',
    description: 'Rejection is irreversible. The declaration status will be permanently set to REJECTED.',
    field: 'reason',
    label: 'Rejection reason',
    placeholder: 'Provide the reason for rejection…',
    required: true,
    schema: workflowRejectSchema,
  },
  clarify: {
    title: 'Request Clarification',
    description: 'The temple authority will be notified to respond to the clarification.',
    field: 'notes',
    label: 'Clarification notes',
    placeholder: 'Describe what needs clarification…',
    required: true,
    schema: dcClarifySchema,
  },
  'flag-physical': {
    title: 'Flag Physical Verification',
    description: 'This temple will be flagged for a physical inspection before further processing.',
    field: 'notes',
    label: 'Verification notes',
    placeholder: 'Describe the reason for physical verification…',
    required: true,
    schema: dcClarifySchema,
  },
}

function WorkflowDialog({ open, kind, onClose, onSubmit, isSubmitting }: WorkflowDialogProps) {
  const meta = DIALOG_META[kind]
  type FieldKey = 'notes' | 'reason'

  const form = useForm<{ [key in FieldKey]?: string }>({
    resolver: zodResolver(meta.schema),
    defaultValues: { [meta.field]: '' },
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

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name={meta.field as FieldKey}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{meta.label}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      placeholder={meta.placeholder}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={onClose} type="button">
                Cancel
              </AlertDialogCancel>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground mt-0.5">{value ?? '—'}</dd>
    </div>
  )
}

function formatCurrency(value?: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}
