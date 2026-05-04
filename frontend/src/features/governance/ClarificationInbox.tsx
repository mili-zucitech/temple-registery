import React, { useState } from 'react'
import {
  useGetClarificationThreadsQuery,
  useRequestClarificationMutation,
  useRespondToClarificationMutation,
  useResolveThreadMutation,
} from './workflowApi'
import type { ClarificationThread, ClarificationMessage } from '../../types/workflow'
import { cn } from '../../lib/utils'

interface ClarificationInboxProps {
  workflowInstanceId: number
  viewerRole: 'TA' | 'DC'
  viewerUserId: number
  className?: string
}

export const ClarificationInbox: React.FC<ClarificationInboxProps> = ({
  workflowInstanceId,
  viewerRole,
  viewerUserId,
  className,
}) => {
  const { data: threads, isLoading } = useGetClarificationThreadsQuery(workflowInstanceId)
  const [requestClarification] = useRequestClarificationMutation()
  const [respondToThread] = useRespondToClarificationMutation()
  const [resolveThread] = useResolveThreadMutation()

  const [newMessage, setNewMessage] = useState('')
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [section, setSection] = useState('')

  const openThreads = threads?.filter(t => t.status === 'OPEN' || t.status === 'RESPONDED') ?? []
  const resolvedThreads = threads?.filter(t => t.status === 'RESOLVED' || t.status === 'ESCALATED') ?? []

  const handleRequestClarification = async () => {
    if (!newMessage.trim()) return
    setIsSubmitting(true)
    try {
      await requestClarification({
        instanceId: workflowInstanceId,
        message: newMessage,
        sectionName: section || undefined,
      }).unwrap()
      setNewMessage('')
      setSection('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRespond = async (threadId: number) => {
    if (!replyText.trim()) return
    setIsSubmitting(true)
    try {
      await respondToThread({
        instanceId: workflowInstanceId,
        threadId,
        message: replyText,
      }).unwrap()
      setReplyText('')
      setActiveThreadId(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResolve = async (threadId: number) => {
    await resolveThread({ instanceId: workflowInstanceId, threadId }).unwrap()
  }

  if (isLoading) {
    return <div className="animate-pulse space-y-3 p-4">
      {[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-xl" />)}
    </div>
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          Clarification Rounds
          {openThreads.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
              {openThreads.length} active
            </span>
          )}
        </h3>
      </div>

      {/* Active Threads */}
      {openThreads.map(thread => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          viewerRole={viewerRole}
          viewerUserId={viewerUserId}
          isExpanded={activeThreadId === thread.id}
          onToggle={() => setActiveThreadId(prev => prev === thread.id ? null : thread.id)}
          replyText={replyText}
          onReplyChange={setReplyText}
          onRespond={() => handleRespond(thread.id)}
          onResolve={() => handleResolve(thread.id)}
          isSubmitting={isSubmitting}
        />
      ))}

      {/* No active threads */}
      {openThreads.length === 0 && resolvedThreads.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">No clarification threads yet.</p>
      )}

      {/* DC: New clarification form */}
      {viewerRole === 'DC' && (
        <div className="border border-dashed border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Request New Clarification</p>
          <input
            value={section}
            onChange={e => setSection(e.target.value)}
            placeholder="Section (optional, e.g. Trust Details)"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
          />
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Describe the clarification needed..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white resize-none"
          />
          <button
            onClick={handleRequestClarification}
            disabled={!newMessage.trim() || isSubmitting}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Sending…' : '❓ Request Clarification'}
          </button>
        </div>
      )}

      {/* Resolved history */}
      {resolvedThreads.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 select-none list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            {resolvedThreads.length} resolved round{resolvedThreads.length > 1 ? 's' : ''}
          </summary>
          <div className="mt-2 space-y-2">
            {resolvedThreads.map(thread => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                viewerRole={viewerRole}
                viewerUserId={viewerUserId}
                isExpanded={false}
                onToggle={() => {}}
                replyText=""
                onReplyChange={() => {}}
                onRespond={() => {}}
                onResolve={() => {}}
                isSubmitting={false}
                readOnly
              />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// ─── Thread Card ──────────────────────────────────────────────────────────────

interface ThreadCardProps {
  thread: ClarificationThread
  viewerRole: 'TA' | 'DC'
  viewerUserId: number
  isExpanded: boolean
  onToggle: () => void
  replyText: string
  onReplyChange: (v: string) => void
  onRespond: () => void
  onResolve: () => void
  isSubmitting: boolean
  readOnly?: boolean
}

const STATUS_STYLES = {
  OPEN:       'bg-amber-100 text-amber-700',
  RESPONDED:  'bg-sky-100 text-sky-700',
  RESOLVED:   'bg-emerald-100 text-emerald-700',
  ESCALATED:  'bg-red-100 text-red-700',
  EXPIRED:    'bg-gray-100 text-gray-500',
}

const ThreadCard: React.FC<ThreadCardProps> = ({
  thread, viewerRole, isExpanded, onToggle,
  replyText, onReplyChange, onRespond, onResolve,
  isSubmitting, readOnly = false,
}) => {
  const canRespond = !readOnly && viewerRole === 'TA' && thread.status === 'OPEN'
  const canResolve = !readOnly && viewerRole === 'DC' && thread.status === 'RESPONDED'

  return (
    <div className={cn(
      'rounded-xl border transition-all duration-200',
      thread.status === 'OPEN' ? 'border-amber-200 bg-amber-50/50' :
      thread.status === 'RESPONDED' ? 'border-sky-200 bg-sky-50/50' :
      'border-slate-200 bg-slate-50',
    )}>
      {/* Thread header */}
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-white border-2 border-current flex items-center justify-center text-xs font-bold text-slate-600">
            {thread.roundNumber}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Round {thread.roundNumber}</p>
            <p className="text-xs text-slate-500">
              {new Date(thread.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_STYLES[thread.status])}>
            {thread.status}
          </span>
          <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Messages */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {thread.messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Reply box (TA) */}
          {canRespond && (
            <div className="space-y-2 pt-2">
              <textarea
                value={replyText}
                onChange={e => onReplyChange(e.target.value)}
                placeholder="Type your response..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:outline-none resize-none bg-white"
              />
              <button
                onClick={onRespond}
                disabled={!replyText.trim() || isSubmitting}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Sending…' : '💬 Submit Response'}
              </button>
            </div>
          )}

          {/* Resolve button (DC) */}
          {canResolve && (
            <button
              onClick={onResolve}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              ✔ Mark as Resolved
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const MessageBubble: React.FC<{ message: ClarificationMessage }> = ({ message }) => {
  const isDc = message.direction === 'DC_TO_TA'
  return (
    <div className={cn('flex gap-2', isDc ? 'flex-row' : 'flex-row-reverse')}>
      <div className={cn(
        'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
        isDc ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
      )}>
        {isDc ? 'DC' : 'TA'}
      </div>
      <div className={cn(
        'max-w-[80%] rounded-xl px-3 py-2 text-sm',
        isDc ? 'bg-indigo-50 text-indigo-900 rounded-tl-none' : 'bg-emerald-50 text-emerald-900 rounded-tr-none'
      )}>
        {message.sectionName && (
          <p className="text-xs font-semibold opacity-60 mb-1">Re: {message.sectionName}</p>
        )}
        <p>{message.message}</p>
        <p className="text-xs opacity-50 mt-1 text-right">
          {new Date(message.createdAtInstant).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' })}
        </p>
      </div>
    </div>
  )
}

export default ClarificationInbox
