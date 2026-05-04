import { useNavigate } from 'react-router-dom'
import { AlertCircle, PencilLine } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTE_PATHS } from '@/constants/routePaths'
import type { DeclarationStatus } from '../../../declarationTypes'

interface RejectionAlertProps {
  status: DeclarationStatus
  declarationId: number
  rejectionReason?: string
}

export function RejectionAlert({ status, declarationId, rejectionReason }: RejectionAlertProps) {
  const navigate = useNavigate()

  if (status !== 'REJECTED') return null

  return (
    <Card className="border-red-200/80 bg-red-50/60">
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertCircle size={18} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-900">Declaration Rejected</p>
            <p className="mt-1 text-sm text-red-800/90">
              {rejectionReason || 'This declaration has been rejected by the District Collector. Please review the feedback, make necessary corrections, and resubmit.'}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-red-300 bg-white hover:bg-red-50"
          onClick={() => navigate(`${ROUTE_PATHS.TA_DECLARATION_NEW}?id=${declarationId}`)}
        >
          <PencilLine size={16} className="mr-2" />
          Update & Resubmit
        </Button>
      </CardContent>
    </Card>
  )
}
