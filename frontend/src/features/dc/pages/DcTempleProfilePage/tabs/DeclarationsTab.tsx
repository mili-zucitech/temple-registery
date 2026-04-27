import { FileText } from 'lucide-react'
import { useMemo } from 'react'
import { DeclarationCard } from '../components'
import { DeclarationDetailSection } from '../components/DeclarationDetailSection'
import { cn } from '@/lib/utils'
import type { DeclarationSummary, DeclarationDetailResponse } from '@/features/dc/dcTypes'

interface DeclarationsTabProps {
  declarations: DeclarationSummary[]
  canAct: boolean
  selectedDeclarationId: number | null
  selectedDeclarationDetail: DeclarationDetailResponse | null
  onSelectDeclaration: (id: number | null) => void
  onApprove: (id: number) => void
  onReject: (id: number) => void
  onClarify: (id: number) => void
  onFlagPhysical: (id: number) => void
}

export function DeclarationsTab({
  declarations,
  canAct,
  selectedDeclarationId,
  selectedDeclarationDetail,
  onSelectDeclaration,
  onApprove,
  onReject,
  onClarify,
  onFlagPhysical,
}: DeclarationsTabProps) {
  const dotColors: Record<string, string> = useMemo(() => ({
    OVERDUE:                         'bg-destructive',
    SUBMITTED:                       'bg-info',
    UNDER_REVIEW:                    'bg-warning',
    CLARIFICATION_REQUIRED:          'bg-accent',
    CLARIFICATION_RESPONDED:         'bg-sky-400',
    SITE_VISIT_SCHEDULED:            'bg-purple-400',
    SITE_VISIT_COMPLETED:            'bg-indigo-400',
    VERIFIED:                        'bg-teal-400',
    APPROVED:                        'bg-success',
    REJECTED:                        'bg-destructive/50',
    DRAFT:                           'bg-muted-foreground/40',
    SUPERSEDED:                      'bg-muted-foreground/30',
  }), [])

  if (declarations.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
        <div className="size-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
          <FileText size={40} className="text-slate-300" />
        </div>
        <p className="text-md font-semibold text-slate-900 mb-2">No declarations on record</p>
        <p className="text-sm font-regular text-slate-500 max-w-[320px]">This temple has not filed any asset declarations. If overdue, consider sending an official notice.</p>
      </div>
    )
  }

  return (
    <div className="relative animate-in fade-in duration-500 max-w-[1200px] mx-auto">
      {/* Timeline spine */}
      <div className="absolute left-[21px] top-8 bottom-0 w-0.5 bg-slate-200" aria-hidden />

      <div className="space-y-6">
        {declarations.map((dec) => {
          const dotCls = dotColors[dec.status] ?? 'bg-slate-300'
          return (
            <div key={dec.id} className="relative">
              {/* Timeline dot */}
              <div
                className={cn(
                  'absolute left-3 top-5 size-4 rounded-full ring-4 ring-slate-50 shadow-sm transition-all duration-300',
                  dotCls
                )}
                aria-hidden
              />
              {/* Card */}
              <div className="pl-12">
                <DeclarationCard
                  declaration={dec}
                  canAct={canAct}
                  isSelected={selectedDeclarationId === dec.id}
                  onSelect={() =>
                    onSelectDeclaration(selectedDeclarationId === dec.id ? null : dec.id)
                  }
                  onApprove={() => onApprove(dec.id)}
                  onReject={() => onReject(dec.id)}
                  onClarify={() => onClarify(dec.id)}
                  onFlagPhysical={() => onFlagPhysical(dec.id)}
                />
                
                {/* Full declaration details when selected */}
                {selectedDeclarationId === dec.id && selectedDeclarationDetail && (
                  <DeclarationDetailSection declaration={selectedDeclarationDetail} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}