import { useNavigate } from 'react-router-dom'
import { ArrowLeft, PencilLine, Sparkles } from 'lucide-react'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTE_PATHS } from '@/constants/routePaths'
import type { CompleteDeclarationResponse, DeclarationVersionResponse } from '../../../declarationTypes'

interface DeclarationHeaderProps {
  declaration: CompleteDeclarationResponse
  versions: DeclarationVersionResponse[]
}

export function DeclarationHeader({ declaration, versions }: DeclarationHeaderProps) {
  const navigate = useNavigate()

  return (
    <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/8 via-card to-secondary/10 shadow-soft-xl">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTE_PATHS.TA_DECLARATIONS)}
              className="-ml-2 w-fit"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles size={14} />
              Declaration Timeline
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Declaration #{declaration.id}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                FY {declaration.financialYear ?? 'N/A'} · Temple {declaration.templeId}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={declaration.status} />
              <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                Version {declaration.versionNumber ?? 1}
              </span>
              {declaration.overdue && (
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                  Overdue
                </span>
              )}
              {declaration.acknowledgementNumber && (
                <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                  Ack {declaration.acknowledgementNumber}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
            <MiniStat label="Versions" value={versions.length} />
            <MiniStat label="Clarifications" value={declaration.clarificationRound ?? 0} />
            <MiniStat
              label="Lease PDFs"
              value={declaration.leasedProperties.filter((item) => item.agreementDocumentId).length}
            />
            <MiniStat label="Status" value={declaration.status.replace(/_/g, ' ')} />
          </div>
        </div>

        {declaration.status === 'DRAFT' && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`${ROUTE_PATHS.TA_DECLARATION_NEW}?id=${declaration.id}`)}
            >
              <PencilLine size={16} className="mr-2" />
              Edit draft
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-soft-sm">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold text-foreground">{value}</div>
    </div>
  )
}
