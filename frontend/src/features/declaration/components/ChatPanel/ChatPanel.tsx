import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useGetConversationQuery } from '../../declarationApi'
import type { ChatMessage, DeclarationStatus } from '../../declarationTypes'
import { ResponseBox } from './ResponseBox'

interface ChatPanelProps {
  declarationId: number
  declarationStatus: DeclarationStatus
  readonly: boolean
}

function formatTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function actorLabel(actor: ChatMessage['actor']): string {
  return actor === 'DC' ? 'District Collector' : 'Temple Authority'
}

const hasMetadata = (m: string | null | undefined): boolean =>
  m != null && m.trim() !== '' && m.toLowerCase() !== 'null'

function getSiteVisitBadgeLabel(message: string): string {
  if (message === 'Site Visit Scheduled') return '📍 Site Visit Scheduled'
  if (message === 'Site Visit Completed') return '✅ Site Visit Done'
  return message
}

interface MessageBubbleProps {
  message: ChatMessage
  isActionRequired: boolean
}

function MessageBubble({ message, isActionRequired }: MessageBubbleProps) {
  const isDC = message.actor === 'DC'
  const isSiteVisit = message.type === 'SITE_VISIT'

  return (
    <div
      className={cn(
        'flex w-full',
        isDC ? 'justify-start' : 'justify-end',
      )}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 space-y-1.5 shadow-sm',
          isDC
            ? 'bg-muted text-foreground rounded-tl-sm'
            : 'bg-secondary text-secondary-foreground rounded-tr-sm',
        )}
      >
        {/* Header row: actor label + badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            {actorLabel(message.actor)}
          </span>

          {isSiteVisit && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-xs border-purple-300 text-purple-700 bg-purple-50"
            >
              <MapPin size={10} />
              {getSiteVisitBadgeLabel(message.message)}
            </Badge>
          )}

          {isActionRequired && (
            <Badge className="text-xs bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-100">
              Action Required
            </Badge>
          )}
        </div>

        {/* Message text — hidden for SITE_VISIT since the badge already shows the label */}
        {!isSiteVisit && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.message}
          </p>
        )}

        {/* Metadata (e.g. site visit notes) */}
        {hasMetadata(message.metadata) && (
          <p className="text-xs text-muted-foreground italic">{message.metadata}</p>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground text-right">
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </div>
  )
}

function ChatSkeletonBubbles() {
  return (
    <div className="space-y-4 p-4">
      {/* Left-aligned bubble */}
      <div className="flex justify-start">
        <div className="max-w-[60%] space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </div>
      {/* Right-aligned bubble */}
      <div className="flex justify-end">
        <div className="max-w-[60%] space-y-2">
          <Skeleton className="h-3 w-24 ml-auto" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
      {/* Left-aligned bubble */}
      <div className="flex justify-start">
        <div className="max-w-[60%] space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

export function ChatPanel({ declarationId, declarationStatus, readonly }: ChatPanelProps) {
  const { data, isLoading, isError } = useGetConversationQuery(declarationId)
  const [collapsed, setCollapsed] = useState(true)

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <ChatSkeletonBubbles />
      </div>
    )
  }

  if (isError) {
    return <EmptyState title="Could not load conversation history." />
  }

  const messages: ChatMessage[] = data?.data ?? []

  const totalCount = messages.length
  const visibleMessages = collapsed ? messages.slice(-3) : messages
  const showToggle = totalCount > 3

  // Find the index of the last CLARIFICATION message (in the full list)
  let lastClarificationIndex = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].type === 'CLARIFICATION') {
      lastClarificationIndex = i
      break
    }
  }

  const showResponseBox = !readonly && declarationStatus === 'CLARIFICATION_REQUIRED'

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {totalCount === 0 ? (
        <EmptyState title="No communication history yet." />
      ) : (
        <>
          <div className="max-h-[480px] overflow-y-auto p-4 space-y-3">
            {visibleMessages.map((msg) => {
              const originalIndex = messages.indexOf(msg)
              const isActionRequired =
                declarationStatus === 'CLARIFICATION_REQUIRED' &&
                msg.type === 'CLARIFICATION' &&
                originalIndex === lastClarificationIndex

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isActionRequired={isActionRequired}
                />
              )
            })}
          </div>

          {showToggle && (
            <div className="px-4 pb-3 flex justify-center">
              <button
                onClick={() => setCollapsed(prev => !prev)}
                className="text-sm text-primary underline-offset-2 hover:underline"
                aria-expanded={!collapsed}
              >
                View conversation ({totalCount})
              </button>
            </div>
          )}
        </>
      )}

      {showResponseBox && (
        <div className="border-t border-border p-4">
          <ResponseBox declarationId={declarationId} />
        </div>
      )}
    </div>
  )
}
