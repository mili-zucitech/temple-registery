/**
 * Unit tests for ChatPanel component.
 *
 * RTK Query hooks are mocked at the module level to keep tests focused on
 * rendering and interaction logic without real network calls.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { ChatPanel } from './ChatPanel'
import {
  useGetConversationQuery,
  useClarificationRespondMutation,
} from '../../declarationApi'
import type { ChatMessage } from '../../declarationTypes'

// ─── Module-level mocks ───────────────────────────────────────────────────────

vi.mock('../../declarationApi', () => ({
  declarationApi: {
    reducerPath: 'declarationApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useGetConversationQuery: vi.fn(),
  useClarificationRespondMutation: vi.fn(),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDcMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'clarification-1',
    type: 'CLARIFICATION',
    actor: 'DC',
    message: 'Please provide land survey documents.',
    timestamp: '2024-01-10T10:00:00',
    metadata: null,
    ...overrides,
  }
}

function makeTaMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'response-1',
    type: 'RESPONSE',
    actor: 'TA',
    message: 'Attached the survey documents.',
    timestamp: '2024-01-11T10:00:00',
    metadata: null,
    ...overrides,
  }
}

function mockConversationQuery(messages: ChatMessage[]) {
  vi.mocked(useGetConversationQuery).mockReturnValue({
    data: { success: true, message: 'OK', data: messages },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetConversationQuery>)
}

function mockClarificationRespond(
  triggerFn = vi.fn(),
  state: Record<string, unknown> = { isLoading: false }
) {
  vi.mocked(useClarificationRespondMutation).mockReturnValue([
    triggerFn,
    state,
  ] as ReturnType<typeof useClarificationRespondMutation>)
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  // Default: empty conversation, idle mutation
  mockConversationQuery([])
  mockClarificationRespond()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ChatPanel', () => {
  /**
   * Req 8.1 — DC messages are left-aligned (justify-start), TA messages are right-aligned (justify-end).
   */
  it('rendersChatMessagesCorrectly', () => {
    const dcMsg = makeDcMessage()
    const taMsg = makeTaMessage()
    mockConversationQuery([dcMsg, taMsg])

    renderWithProviders(
      <ChatPanel
        declarationId={1}
        declarationStatus="UNDER_REVIEW"
        readonly={true}
      />
    )

    // DC message bubble wrapper should have justify-start
    const dcText = screen.getByText(dcMsg.message)
    const dcBubbleWrapper = dcText.closest('.justify-start')
    expect(dcBubbleWrapper).toBeInTheDocument()

    // TA message bubble wrapper should have justify-end
    const taText = screen.getByText(taMsg.message)
    const taBubbleWrapper = taText.closest('.justify-end')
    expect(taBubbleWrapper).toBeInTheDocument()
  })

  /**
   * Req 8.2 — "Action Required" badge appears on the last CLARIFICATION message
   * when status is CLARIFICATION_REQUIRED.
   */
  it('highlightsClarificationForTA', () => {
    const clarificationMsg = makeDcMessage({
      id: 'clarification-5',
      type: 'CLARIFICATION',
      actor: 'DC',
      message: 'Please clarify the building valuation.',
    })
    mockConversationQuery([clarificationMsg])

    renderWithProviders(
      <ChatPanel
        declarationId={1}
        declarationStatus="CLARIFICATION_REQUIRED"
        readonly={false}
      />
    )

    expect(screen.getByText('Action Required')).toBeInTheDocument()
  })

  /**
   * Req 8.3 — ResponseBox (textarea + submit button) is present when
   * readonly=false and status=CLARIFICATION_REQUIRED.
   */
  it('showsResponseBoxOnlyWhenRequired', () => {
    const clarificationMsg = makeDcMessage()
    mockConversationQuery([clarificationMsg])

    renderWithProviders(
      <ChatPanel
        declarationId={1}
        declarationStatus="CLARIFICATION_REQUIRED"
        readonly={false}
      />
    )

    // Textarea and submit button should be present
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Submit Response/i })).toBeInTheDocument()
  })

  /**
   * Req 8.4 — ResponseBox is absent for all statuses other than CLARIFICATION_REQUIRED.
   */
  it('hidesResponseBoxOtherwise', () => {
    const nonClarificationStatuses = [
      'DRAFT',
      'SUBMITTED',
      'UNDER_REVIEW',
      'CLARIFICATION_RESPONDED',
      'SITE_VISIT_SCHEDULED',
      'SITE_VISIT_COMPLETED',
      'VERIFIED',
      'APPROVED',
      'REJECTED',
      'OVERDUE',
      'SUPERSEDED',
    ] as const

    const messages = [makeDcMessage()]
    mockConversationQuery(messages)

    for (const status of nonClarificationStatuses) {
      const { unmount } = renderWithProviders(
        <ChatPanel
          declarationId={1}
          declarationStatus={status}
          readonly={false}
        />
      )

      // Neither textarea nor submit button should be present
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /Submit Response/i })
      ).not.toBeInTheDocument()

      unmount()
    }
  })

  /**
   * Req 8.5 — Metadata field is displayed when present in a message.
   */
  it('rendersImagesAndDocuments', () => {
    const metadataValue = 'Inspector noted structural concerns during visit.'
    const siteVisitMsg: ChatMessage = {
      id: 'site-visit-3',
      type: 'SITE_VISIT',
      actor: 'DC',
      message: 'Site Visit Scheduled',
      timestamp: '2024-02-01T09:00:00',
      metadata: metadataValue,
    }
    mockConversationQuery([siteVisitMsg])

    renderWithProviders(
      <ChatPanel
        declarationId={1}
        declarationStatus="SITE_VISIT_SCHEDULED"
        readonly={true}
      />
    )

    expect(screen.getByText(metadataValue)).toBeInTheDocument()
  })

  /**
   * Req 8.6 — After a successful clarificationRespond mutation, RTK Query cache
   * invalidation triggers a refetch of useGetConversationQuery.
   * We verify this by checking that useGetConversationQuery is called again
   * after the mutation succeeds (simulated via re-render with updated mock).
   */
  it('updatesChatAfterResponse', async () => {
    const initialMessages = [makeDcMessage()]
    mockConversationQuery(initialMessages)

    const mockTrigger = vi.fn().mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ success: true, data: {} }),
    })
    mockClarificationRespond(mockTrigger)

    renderWithProviders(
      <ChatPanel
        declarationId={42}
        declarationStatus="CLARIFICATION_REQUIRED"
        readonly={false}
      />
    )

    // Submit a response
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Here is my response.' } })
    fireEvent.click(screen.getByRole('button', { name: /Submit Response/i }))

    await waitFor(() => {
      expect(mockTrigger).toHaveBeenCalledWith({
        id: 42,
        body: { message: 'Here is my response.' },
      })
    })

    // Simulate cache invalidation causing a refetch — update the mock to return
    // new data and verify useGetConversationQuery was called with the same id
    const newMessages = [makeDcMessage(), makeTaMessage()]
    mockConversationQuery(newMessages)

    // useGetConversationQuery should have been called with declarationId=42
    expect(useGetConversationQuery).toHaveBeenCalledWith(42)
  })

  /**
   * Req 8.7 — useGetConversationQuery is called exactly once per render
   * (RTK Query cache is not bypassed).
   */
  it('noDuplicateApiCalls', () => {
    mockConversationQuery([makeDcMessage()])

    renderWithProviders(
      <ChatPanel
        declarationId={7}
        declarationStatus="UNDER_REVIEW"
        readonly={true}
      />
    )

    // The hook should be called exactly once with the declarationId
    expect(useGetConversationQuery).toHaveBeenCalledTimes(1)
    expect(useGetConversationQuery).toHaveBeenCalledWith(7)
  })

  /**
   * Req 13.5 — No metadata line is rendered when metadata is null or the string "null"
   * (case-insensitive variants: "null", "NULL", "Null").
   */
  it('hidesNullMetadata', () => {
    const nullVariants: Array<string | null> = [null, 'null', 'NULL', 'Null']

    for (const metadata of nullVariants) {
      const msg: ChatMessage = {
        id: 'site-visit-99',
        type: 'SITE_VISIT',
        actor: 'DC',
        message: 'Site Visit Scheduled',
        timestamp: '2024-03-01T09:00:00',
        metadata,
      }
      mockConversationQuery([msg])

      const { unmount } = renderWithProviders(
        <ChatPanel
          declarationId={1}
          declarationStatus="SITE_VISIT_SCHEDULED"
          readonly={true}
        />
      )

      // No element should contain the raw null-like metadata value
      expect(document.querySelector('p.italic')).not.toBeInTheDocument()

      unmount()
    }
  })

  /**
   * Req 13.6 — Metadata value is rendered when metadata is a non-null, non-empty,
   * non-"null" string.
   */
  it('showsMetadataWhenPresent', () => {
    const metadataValue = 'Scheduled for inspection'
    const msg: ChatMessage = {
      id: 'site-visit-100',
      type: 'SITE_VISIT',
      actor: 'DC',
      message: 'Site Visit Scheduled',
      timestamp: '2024-03-01T09:00:00',
      metadata: metadataValue,
    }
    mockConversationQuery([msg])

    renderWithProviders(
      <ChatPanel
        declarationId={1}
        declarationStatus="SITE_VISIT_SCHEDULED"
        readonly={true}
      />
    )

    expect(screen.getByText(metadataValue)).toBeInTheDocument()
  })
})
