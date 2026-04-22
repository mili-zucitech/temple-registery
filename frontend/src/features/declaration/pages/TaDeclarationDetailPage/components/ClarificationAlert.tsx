import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import type { DeclarationStatus } from '../../../declarationTypes'

interface ClarificationAlertProps {
  status: DeclarationStatus
}

export function ClarificationAlert({ status }: ClarificationAlertProps) {
  const isClarificationPending = status === 'CLARIFICATION_REQUESTED' || status === 'REJECTED'

  if (!isClarificationPending) return null

  return (
    <Card className="border-orange-200/80 bg-orange-50/60">
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-orange-900">Action required</p>
          <p className="text-sm text-orange-800/90">
            The declaration needs clarification or has been returned for rework. Update the values and resubmit.
          </p>
        </div>
        <StatusBadge status={status} />
      </CardContent>
    </Card>
  )
}
