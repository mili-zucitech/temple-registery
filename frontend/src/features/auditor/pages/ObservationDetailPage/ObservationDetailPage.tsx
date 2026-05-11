import { useParams, useNavigate } from 'react-router-dom'
import { useGetObservationQuery } from '@/features/auditor/auditorApi'
import { useCloseObservationMutation, useAssignObservationMutation } from '@/features/admin/adminApi'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAppSelector } from '@/app/store'
import { USER_ROLES } from '@/constants/roles'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { extractApiErrorMessage } from '@/lib/apiError'

const SEVERITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'default',
  CRITICAL: 'destructive',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OPEN: 'destructive',
  ASSIGNED: 'default',
  CLOSED: 'secondary',
}

export function ObservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAppSelector((s) => s.auth.currentUser)
  const isSuperAdmin = currentUser?.role === USER_ROLES.SUPER_ADMIN

  const { data, isLoading, isError } = useGetObservationQuery(Number(id))
  const [closeObs, { isLoading: isClosing }] = useCloseObservationMutation()
  const [assignObs, { isLoading: isAssigning }] = useAssignObservationMutation()

  const [resolutionNote, setResolutionNote] = useState('')
  const [assignUserId, setAssignUserId] = useState('')
  const [closeError, setCloseError] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)

  const obs = data?.data

  const handleClose = async () => {
    if (!resolutionNote.trim() || !id) return
    setCloseError(null)
    try {
      await closeObs({ id: Number(id), resolutionNote }).unwrap()
    } catch (err) {
      setCloseError(extractApiErrorMessage(err, 'Failed to close observation. Please try again.'))
    }
  }

  const handleAssign = async () => {
    const uid = Number(assignUserId)
    if (!uid || !id) return
    setAssignError(null)
    try {
      await assignObs({ id: Number(id), assignedToUserId: uid }).unwrap()
      setAssignUserId('')
    } catch (err) {
      setAssignError(extractApiErrorMessage(err, 'Failed to assign observation. Please try again.'))
    }
  }

  if (isLoading) return <div className="p-8"><CardSkeleton /></div>
  if (isError || !obs) return <EmptyState title="Observation not found" />

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold leading-snug">{obs.title}</h1>
          <div className="flex gap-2 flex-shrink-0">
            <Badge variant={SEVERITY_VARIANT[obs.severity] ?? 'outline'}>{obs.severity}</Badge>
            <Badge variant={STATUS_VARIANT[obs.status] ?? 'outline'}>{obs.status}</Badge>
          </div>
        </div>

        <div className="text-sm text-muted-foreground leading-relaxed">{obs.description}</div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mt-2">
          <div>
            <dt className="text-muted-foreground">Temple</dt>
            <dd className="font-medium">{obs.templeName ?? `#${obs.templeId}`}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Entity</dt>
            <dd className="font-medium">{obs.entityType} #{obs.entityId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Raised by</dt>
            <dd className="font-medium">User #{obs.raisedByUserId}</dd>
          </div>
          {obs.assignedToUserId && (
            <div>
              <dt className="text-muted-foreground">Assigned to</dt>
              <dd className="font-medium">User #{obs.assignedToUserId}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium">{new Date(obs.createdAt).toLocaleString()}</dd>
          </div>
          {obs.closedAt && (
            <div>
              <dt className="text-muted-foreground">Closed</dt>
              <dd className="font-medium">{new Date(obs.closedAt).toLocaleString()}</dd>
            </div>
          )}
        </dl>

        {obs.resolutionNote && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Resolution Note</p>
            <p className="text-sm">{obs.resolutionNote}</p>
          </div>
        )}
      </div>

      {/* SUPER_ADMIN actions */}
      {isSuperAdmin && obs.status !== 'CLOSED' && (
        <div className="space-y-4">
          {obs.status === 'OPEN' && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-sm font-semibold">Assign Observation</h2>
              {assignError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{assignError}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="User ID"
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="flex h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                />
                <Button size="sm" disabled={!assignUserId || isAssigning} onClick={handleAssign}>
                  {isAssigning ? 'Assigning…' : 'Assign'}
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold">Close Observation</h2>
            {closeError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{closeError}</AlertDescription>
              </Alert>
            )}
            <textarea
              placeholder="Resolution note (required)"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-none"
            />
            <Button size="sm" variant="destructive" disabled={!resolutionNote.trim() || isClosing} onClick={handleClose}>
              {isClosing ? 'Closing…' : 'Close Observation'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
