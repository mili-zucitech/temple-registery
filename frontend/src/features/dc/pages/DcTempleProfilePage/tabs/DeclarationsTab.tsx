import { FileText, MessageSquare, Eye, Calendar, IndianRupee, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DeclarationCard } from '../components'
import { DeclarationDetailSection } from '../components/DeclarationDetailSection'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChatPanel } from '@/features/declaration/components/ChatPanel'
import { cn } from '@/lib/utils'
import type { DeclarationSummary, DeclarationDetailResponse } from '@/features/dc/dcTypes'
import type { DeclarationStatus } from '@/features/declaration/declarationTypes'

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
  const [conversationModalOpen, setConversationModalOpen] = useState(false)
  const [conversationDeclarationId, setConversationDeclarationId] = useState<number | null>(null)
  const [conversationDeclarationStatus, setConversationDeclarationStatus] = useState<DeclarationStatus | null>(null)

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

  const openConversationModal = (declarationId: number, status: string) => {
    setConversationDeclarationId(declarationId)
    setConversationDeclarationStatus(status as DeclarationStatus)
    setConversationModalOpen(true)
  }

  const closeConversationModal = () => {
    setConversationModalOpen(false)
    setConversationDeclarationId(null)
    setConversationDeclarationStatus(null)
  }

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
          const isSelected = selectedDeclarationId === dec.id
          const actionable = ['SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_RESPONDED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'VERIFIED'].includes(dec.status)
          
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
                <ModernDeclarationCard
                  declaration={dec}
                  canAct={canAct}
                  isSelected={isSelected}
                  onSelect={() => onSelectDeclaration(isSelected ? null : dec.id)}
                  onApprove={() => onApprove(dec.id)}
                  onReject={() => onReject(dec.id)}
                  onClarify={() => onClarify(dec.id)}
                  onFlagPhysical={() => onFlagPhysical(dec.id)}
                  onOpenConversation={() => openConversationModal(dec.id, dec.status)}
                />
                
                {/* Full declaration details when selected */}
                {isSelected && selectedDeclarationDetail && (
                  <DeclarationDetailSection declaration={selectedDeclarationDetail} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Conversation Modal */}
      <Dialog open={conversationModalOpen} onOpenChange={setConversationModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Conversation History
            </DialogTitle>
          </DialogHeader>
          {conversationDeclarationId && conversationDeclarationStatus && (
            <div className="mt-4">
              <ChatPanel
                declarationId={conversationDeclarationId}
                declarationStatus={conversationDeclarationStatus}
                readonly={true}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Modern Declaration Card Component
interface ModernDeclarationCardProps {
  declaration: DeclarationSummary
  canAct: boolean
  isSelected: boolean
  onSelect: () => void
  onApprove: () => void
  onReject: () => void
  onClarify: () => void
  onFlagPhysical: () => void
  onOpenConversation: () => void
}

function ModernDeclarationCard({
  declaration,
  canAct,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onClarify,
  onFlagPhysical,
  onOpenConversation,
}: ModernDeclarationCardProps) {
  const actionable = ['SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_RESPONDED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'VERIFIED'].includes(declaration.status)
  const isUrgent = declaration.status === 'OVERDUE'

  const getStatusIcon = () => {
    if (declaration.status === 'APPROVED') return <CheckCircle2 size={14} className="text-success" />
    if (declaration.status === 'REJECTED') return <AlertCircle size={14} className="text-destructive" />
    if (isUrgent) return <Clock size={14} className="text-destructive" />
    return <FileText size={14} className="text-primary" />
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-white transition-all overflow-hidden',
        isUrgent ? 'border-red-200 bg-red-50/10' : 'border-slate-200 shadow-sm',
        isSelected && 'ring-2 ring-primary/50 border-primary shadow-lg'
      )}
    >
      {/* Header - Clickable */}
      <div
        className="px-5 py-4 cursor-pointer hover:bg-muted/5 transition-colors"
        onClick={onSelect}
        role="button"
        aria-expanded={isSelected}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Title and metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon()}
              <h3 className="text-lg font-semibold text-foreground">
                FY {declaration.financialYear}
              </h3>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border/50 uppercase tracking-wider">
                v{declaration.versionNumber}
              </span>
            </div>
            
            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {declaration.acknowledgementNumber && (
                <div className="flex items-center gap-1.5">
                  <FileText size={12} />
                  <span className="font-mono">ACK-{declaration.acknowledgementNumber}</span>
                </div>
              )}
              {declaration.submittedAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>Filed: {new Date(declaration.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              {(declaration.agriculturalLandValue != null || declaration.buildingsValue != null) && (
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <IndianRupee size={12} />
                  <span>{formatCurrency((declaration.agriculturalLandValue ?? 0) + (declaration.buildingsValue ?? 0) + (declaration.financialAssetsValue ?? 0) + (declaration.otherMovableValue ?? 0))}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Conversation button and Status badge */}
          <div className="flex items-center gap-3">
            {/* Conversation button - before status badge */}
            {isSelected && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenConversation()
                }}
                className="h-8 text-xs font-medium"
              >
                <MessageSquare size={14} className="mr-1.5" />
                View
              </Button>
            )}
            
            {/* Status badge and action indicator */}
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={declaration.status} />
              {actionable && !isSelected && (
                <span className="text-xs text-amber-600 font-medium flex items-center gap-1 animate-pulse">
                  <Clock size={10} /> ACTION REQ.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isSelected && (
        <>
          {/* Action buttons */}
          {canAct && actionable && (
            <div className="border-t border-border bg-gradient-to-br from-muted/30 to-muted/10 px-5 py-3 flex flex-wrap gap-2">
              <Button 
                size="sm" 
                onClick={onApprove} 
                className="h-9 text-xs font-medium bg-success hover:bg-success/90 text-white shadow-sm"
              >
                <CheckCircle2 size={14} className="mr-1.5" />
                APPROVE
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onReject} 
                className="h-9 text-xs font-medium text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <AlertCircle size={14} className="mr-1.5" />
                REJECT
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onClarify} 
                className="h-9 text-xs font-medium"
              >
                <MessageSquare size={14} className="mr-1.5" />
                REQUEST CLARIFICATION
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onFlagPhysical} 
                className="h-9 text-xs font-medium"
              >
                <Eye size={14} className="mr-1.5" />
                SCHEDULE SITE VISIT
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Helper function
function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

// Import StatusBadge component
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'