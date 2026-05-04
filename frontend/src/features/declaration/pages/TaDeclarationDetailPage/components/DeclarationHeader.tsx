import { useNavigate } from 'react-router-dom'
import { DeclarationStatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { ArrowLeft, PencilLine, Sparkles, FileCheck2, Calendar, Building2, TrendingUp } from 'lucide-react'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTE_PATHS } from '@/constants/routePaths'
import type { CompleteDeclarationResponse, DeclarationVersionResponse } from '../../../declarationTypes'
import { getAvailableActions } from '../../../declarationPermissions'
import { useAppSelector } from '@/app/store'
import { ChatModal } from '@/features/declaration/components/ChatModal'

interface DeclarationHeaderProps {
  declaration: CompleteDeclarationResponse
  versions: DeclarationVersionResponse[]
}

export function DeclarationHeader({ declaration, versions }: DeclarationHeaderProps) {
  const navigate = useNavigate()
  const role = useAppSelector((state) => state.auth.currentUser?.role)
  const actions = getAvailableActions(declaration.status, role ?? '')

  return (
    <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/5 via-card to-secondary/5 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTE_PATHS.TA_DECLARATIONS)}
            className="h-8 px-3 text-xs"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Declarations
          </Button>
          <div className="flex items-center gap-2">
            <ChatModal 
              declarationId={declaration.id}
              declarationStatus={declaration.status}
              readonly={false}
            />
            {(declaration.status === 'DRAFT' || declaration.status === 'REJECTED') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`${ROUTE_PATHS.TA_DECLARATION_NEW}?id=${declaration.id}`)}
              >
                <PencilLine size={16} className="mr-2" />
                {declaration.status === 'REJECTED' ? 'Update & Resubmit' : 'Edit draft'}
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <FileCheck2 size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Declaration #{declaration.id}
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Review declaration details and asset information
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={declaration.status} />
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Calendar size={12} />
            FY {declaration.financialYear ?? 'N/A'}
          </span>
          <span className="rounded-md border border-border/60 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground">
            Version {declaration.versionNumber ?? 1}
          </span>
          {declaration.overdue && (
            <span className="rounded-md bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-800">
              Overdue
            </span>
          )}
          {declaration.acknowledgementNumber && (
            <span className="rounded-md border border-border/60 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground">
              Ack {declaration.acknowledgementNumber}
            </span>
          )}
        </div>

        {actions.canEdit && (
          <div className="flex flex-wrap gap-2">
            <ChatModal 
              declarationId={declaration.id}
              declarationStatus={declaration.status}
              readonly={false}
            />
            <Button
              variant="outline"
              onClick={() => navigate(`${ROUTE_PATHS.TA_DECLARATION_NEW}?id=${declaration.id}`)}
            >
              <PencilLine size={16} className="mr-2" />
              {declaration.status === 'REJECTED' ? 'Update & Resubmit' : 'Edit draft'}
            </Button>
          </div>
        )}
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Total Versions" value={versions.length} icon={<TrendingUp size={14} />} />
          <MiniStat label="Clarifications" value={declaration.clarificationRound ?? 0} icon={<FileCheck2 size={14} />} />
          <MiniStat
            label="Lease Documents"
            value={declaration.leasedProperties.filter((item) => item.agreementDocumentId).length}
            icon={<Building2 size={14} />}
          />
          <MiniStat label="Temple ID" value={`#${declaration.templeId}`} icon={<Building2 size={14} />} />
        </div>
      </CardContent>
    </Card>
  )
}

function MiniStat({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-gradient-to-br from-background/80 to-muted/30 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-primary/70">{icon}</div>
      </div>
      <div className="mt-1.5 text-base font-semibold text-foreground">{value}</div>
    </div>
  )
}
