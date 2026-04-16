import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { useGetDeclarationQuery, useApproveDeclarationMutation, useRejectDeclarationMutation, useRequestClarificationMutation } from '../../declarationApi'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clarificationSchema, type ClarificationRequest } from '../../declarationTypes'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form'
import { useAppSelector } from '@/app/store'
import { USER_ROLES } from '@/constants/roles'

type ActionType = 'approve' | 'reject' | 'clarification' | null

export function DeclarationReviewPage() {
  const { id: declarationId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const id = Number(declarationId)
  const [activeAction, setActiveAction] = useState<ActionType>(null)

  // Must be called before any early returns (React hooks rule).
  // Only DISTRICT_COLLECTOR and SUPER_ADMIN can approve/reject/clarify.
  const role = useAppSelector((s) => s.auth.currentUser?.role)
  const canAct = role === USER_ROLES.DISTRICT_COLLECTOR || role === USER_ROLES.SUPER_ADMIN

  const { data, isLoading, isError } = useGetDeclarationQuery(id, { skip: !id })
  const [approve, { isLoading: approving }] = useApproveDeclarationMutation()
  const [reject, { isLoading: rejecting }] = useRejectDeclarationMutation()
  const [requestClarification, { isLoading: clarifying }] = useRequestClarificationMutation()

  const form = useForm<ClarificationRequest>({
    resolver: zodResolver(clarificationSchema),
    defaultValues: { message: '' },
  })

  const declaration = data?.data

  const handleApprove = async () => {
    try {
      await approve(id).unwrap()
      toast.success('Declaration approved')
      navigate(-1)
    } catch {
      toast.error('Failed to approve declaration')
    }
  }

  const handleAction = async (values: ClarificationRequest) => {
    try {
      if (activeAction === 'reject') {
        await reject({ id, body: values }).unwrap()
        toast.success('Declaration rejected')
      } else if (activeAction === 'clarification') {
        await requestClarification({ id, body: values }).unwrap()
        toast.success('Clarification requested')
      }
      form.reset()
      setActiveAction(null)
      navigate(-1)
    } catch {
      toast.error('Action failed. Please try again.')
    }
  }

  if (isLoading) return <CardSkeleton />
  if (isError || !declaration) return <EmptyState title="Declaration not found" />

  const canReview = (declaration.status === 'SUBMITTED' || declaration.status === 'CLARIFICATION_REQUESTED') && canAct

  return (
    <div className="max-w-3xl w-full space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Declaration #{declaration.id}</h2>
          <p className="text-sm text-muted-foreground">Temple #{declaration.templeId}</p>
        </div>
        <StatusBadge status={declaration.status} />
      </div>

      {/* Asset Details */}
      <div className="rounded-lg border border-border bg-card p-3 sm:p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Immovable Assets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Detail label="Agricultural Land (acres)" value={declaration.agriculturalLandAcres} />
          <Detail label="Agri. Land Value (₹)" value={declaration.agriculturalLandValue} />
          <Detail label="Buildings (sqft)" value={declaration.buildingsSqft} />
          <Detail label="Buildings Value (₹)" value={declaration.buildingsValue} />
        </div>

        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground pt-2">Movable Assets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Detail label="Gold (grams)" value={declaration.goldGrams} />
          <Detail label="Silver (grams)" value={declaration.silverGrams} />
          <Detail label="Vehicles" value={declaration.vehiclesCount} />
          <Detail label="Idols" value={declaration.idolsCount} />
          <Detail label="Financial Assets (₹)" value={declaration.financialAssetsValue} />
        </div>

        {declaration.submittedAt && (
          <p className="text-xs text-muted-foreground pt-2">
            Submitted: {new Date(declaration.submittedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Actions */}
      {canReview && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-gradient-gold shadow-gold" disabled={approving}>
                  {approving ? 'Approving…' : 'Approve'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve Declaration?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the declaration as approved and generate an acknowledgement.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApprove}>Approve</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="outline"
              onClick={() => setActiveAction(activeAction === 'clarification' ? null : 'clarification')}
            >
              Request Clarification
            </Button>
            <Button
              variant="destructive"
              onClick={() => setActiveAction(activeAction === 'reject' ? null : 'reject')}
            >
              Reject
            </Button>
          </div>

          {(activeAction === 'clarification' || activeAction === 'reject') && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAction)} className="rounded-lg border border-border bg-card p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {activeAction === 'reject' ? 'Rejection Reason' : 'Clarification Message'}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          maxLength={2000}
                          placeholder="Enter your message (max 2000 characters)…"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" variant={activeAction === 'reject' ? 'destructive' : 'default'} disabled={rejecting || clarifying}>
                    {rejecting || clarifying ? 'Submitting…' : 'Submit'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setActiveAction(null)}>Cancel</Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value?: number | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value != null ? value.toLocaleString() : '—'}</p>
    </div>
  )
}
