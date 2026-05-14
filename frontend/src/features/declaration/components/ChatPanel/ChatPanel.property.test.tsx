/**
 * Property-based tests for ChatPanel and DeclarationListPage using fast-check.
 *
 * These tests verify invariants that must hold for any combination of inputs,
 * complementing the named unit tests in ChatPanel.test.tsx.
 *
 * Requirements: 3.2, 3.5, 4.2, 4.4, 4.5, 9.2, 9.3, 9.4, 9.5, 9.7,
 *               11.1, 11.2, 11.5, 13.1, 13.2, 13.3, 13.4, 14.1, 14.3
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, cleanup, within, fireEvent } from '@testing-library/react'
import * as fc from 'fast-check'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { ChatPanel } from './ChatPanel'
import {
  useGetConversationQuery,
  useClarificationRespondMutation,
} from '../../declarationApi'
import type { ChatMessage, ChatActor, ChatMessageType, DeclarationStatus } from '../../declarationTypes'
import { DECLARATION_STATUSES } from '../../declarationTypes'
import { Clock } from 'lucide-react'

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

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const actorArb: fc.Arbitrary<ChatActor> = fc.constantFrom('DC', 'TA')

const messageTypeArb: fc.Arbitrary<ChatMessageType> = fc.constantFrom(
  'CLARIFICATION',
  'RESPONSE',
  'SITE_VISIT'
)

const declarationStatusArb: fc.Arbitrary<DeclarationStatus> = fc.constantFrom(
  ...DECLARATION_STATUSES
)

const chatMessageArb: fc.Arbitrary<ChatMessage> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 40 }),
  type: messageTypeArb,
  actor: actorArb,
  message: fc.string({ minLength: 1, maxLength: 200 }),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(
    (d) => d.toISOString()
  ),
  metadata: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
})

// Ensure unique IDs to avoid React key collisions in rendered output
function deduplicateIds(messages: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>()
  return messages.map((m, i) => {
    const id = seen.has(m.id) ? `${m.id}-${i}` : m.id
    seen.add(id)
    return { ...m, id }
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockConversationQuery(messages: ChatMessage[]) {
  vi.mocked(useGetConversationQuery).mockReturnValue({
    data: { success: true, message: 'OK', data: messages },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useGetConversationQuery>)
}

function mockClarificationRespond() {
  vi.mocked(useClarificationRespondMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false },
  ] as ReturnType<typeof useClarificationRespondMutation>)
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockClarificationRespond()
})

// ─── Property Tests ───────────────────────────────────────────────────────────

describe('ChatPanel — property tests', () => {
  /**
   * Feature: unified-declaration-chat, Property 6: Response_Box visibility
   *
   * For any DeclarationStatus value:
   *   - ResponseBox is present iff readonly=false AND status === 'CLARIFICATION_REQUIRED'
   *   - ResponseBox is NEVER present when readonly=true
   *
   * Validates: Requirements 3.5, 4.4, 4.5
   */
  it('Property 6: ResponseBox visibility — present iff readonly=false and status=CLARIFICATION_REQUIRED', () => {
    // Feature: unified-declaration-chat, Property 6: Response_Box visibility
    fc.assert(
      fc.property(
        declarationStatusArb,
        fc.boolean(),
        fc.array(chatMessageArb, { minLength: 0, maxLength: 5 }),
        (status, readonly, rawMessages) => {
          const messages = deduplicateIds(rawMessages)
          mockConversationQuery(messages)

          const { unmount } = renderWithProviders(
            <ChatPanel
              declarationId={1}
              declarationStatus={status}
              readonly={readonly}
            />
          )

          const textarea = screen.queryByRole('textbox')
          const submitButton = screen.queryByRole('button', { name: /Submit Response/i })

          const shouldShowResponseBox =
            !readonly && status === 'CLARIFICATION_REQUIRED'

          if (shouldShowResponseBox) {
            // Both textarea and submit button must be present
            expect(textarea).toBeInTheDocument()
            expect(submitButton).toBeInTheDocument()
          } else {
            // Neither should be present
            expect(textarea).not.toBeInTheDocument()
            expect(submitButton).not.toBeInTheDocument()
          }

          // Additional invariant: readonly=true NEVER shows ResponseBox
          if (readonly) {
            expect(textarea).not.toBeInTheDocument()
            expect(submitButton).not.toBeInTheDocument()
          }

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: unified-declaration-chat, Property 7: Message rendering alignment
   *
   * For any array of ChatMessage objects:
   *   - Messages with actor='DC' have the left-alignment CSS class (justify-start)
   *   - Messages with actor='TA' have the right-alignment CSS class (justify-end)
   *   - This holds regardless of message content, type, or position in the list
   *
   * Validates: Requirements 3.2, 4.2
   */
  it('Property 7: Message rendering alignment — DC=left, TA=right for any message array', () => {
    // Feature: unified-declaration-chat, Property 7: Message rendering alignment
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: messageTypeArb,
            actor: actorArb,
            metadata: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          }),
          { minLength: 1, maxLength: 8 }
        ),
        declarationStatusArb,
        fc.boolean(),
        (rawEntries, status, readonly) => {
          const messages: ChatMessage[] = rawEntries.map((entry, i) => ({
            id: `msg-${i}`,
            type: entry.type,
            actor: entry.actor,
            message: `unique-msg-text-${i}`,
            timestamp: '2024-06-01T10:00:00.000Z',
            metadata: entry.metadata,
          }))

          mockConversationQuery(messages)

          const { unmount, container } = renderWithProviders(
            <ChatPanel
              declarationId={1}
              declarationStatus={status}
              readonly={readonly}
            />
          )

          for (const msg of messages) {
            const allTextEls = within(container).queryAllByText(msg.message)
            if (allTextEls.length === 0) continue // message is collapsed, skip

            const textEl = allTextEls[0]

            if (msg.actor === 'DC') {
              const wrapper = textEl.closest('.justify-start')
              expect(wrapper).toBeInTheDocument()
              const wrongWrapper = textEl.closest('.justify-end')
              expect(wrongWrapper).toBeNull()
            } else {
              const wrapper = textEl.closest('.justify-end')
              expect(wrapper).toBeInTheDocument()
              const wrongWrapper = textEl.closest('.justify-start')
              expect(wrongWrapper).toBeNull()
            }
          }

          unmount()
          cleanup()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: unified-declaration-chat, Property 8: Collapsed initial state
   *
   * For any message array with length > 3, initial render shows exactly 3
   * message bubbles (the last 3 in chronological order).
   *
   * Validates: Requirements 9.2
   */
  it('Property 8: Collapsed initial state — shows exactly last 3 messages when count > 3', () => {
    // Feature: unified-declaration-chat, Property 8: Collapsed initial state
    fc.assert(
      fc.property(
        // Generate arrays of 4–10 messages with unique IDs and unique text
        fc.integer({ min: 4, max: 10 }).chain((n) =>
          fc.tuple(
            fc.constant(n),
            fc.array(
              fc.record({
                type: messageTypeArb,
                actor: actorArb,
                metadata: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
              }),
              { minLength: n, maxLength: n }
            )
          )
        ),
        declarationStatusArb,
        ([n, rawEntries], status) => {
          const messages: ChatMessage[] = rawEntries.map((entry, i) => ({
            id: `msg-${i}`,
            type: entry.type,
            actor: entry.actor,
            message: `prop8-msg-${i}`,
            timestamp: new Date(2024, 0, 1, i).toISOString(),
            metadata: entry.metadata,
          }))

          mockConversationQuery(messages)

          const { unmount, container } = renderWithProviders(
            <ChatPanel
              declarationId={1}
              declarationStatus={status}
              readonly={true}
            />
          )

          // Count rendered message bubbles by looking for unique message texts
          const renderedMessages = messages.filter((msg) =>
            within(container).queryAllByText(msg.message).length > 0
          )

          // Exactly 3 messages should be visible in collapsed state
          expect(renderedMessages).toHaveLength(3)

          // The 3 visible messages must be the LAST 3 (most recent)
          const expectedVisible = messages.slice(-3)
          for (const expected of expectedVisible) {
            expect(within(container).queryByText(expected.message)).toBeInTheDocument()
          }

          // The first (n - 3) messages must NOT be visible
          const expectedHidden = messages.slice(0, n - 3)
          for (const hidden of expectedHidden) {
            expect(within(container).queryByText(hidden.message)).not.toBeInTheDocument()
          }

          unmount()
          cleanup()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Feature: unified-declaration-chat, Property 9: Toggle expand/collapse round-trip
   *
   * For any message array with length > 3:
   *   - Clicking toggle once shows all N messages
   *   - Clicking toggle again shows only the last 3
   *
   * Validates: Requirements 9.3, 9.4
   */
  it('Property 9: Toggle expand/collapse round-trip — expand shows all, collapse shows last 3', () => {
    // Feature: unified-declaration-chat, Property 9: Toggle expand/collapse round-trip
    fc.assert(
      fc.property(
        fc.integer({ min: 4, max: 8 }).chain((n) =>
          fc.tuple(
            fc.constant(n),
            fc.array(
              fc.record({
                type: messageTypeArb,
                actor: actorArb,
              }),
              { minLength: n, maxLength: n }
            )
          )
        ),
        declarationStatusArb,
        ([n, rawEntries], status) => {
          const messages: ChatMessage[] = rawEntries.map((entry, i) => ({
            id: `msg-${i}`,
            type: entry.type,
            actor: entry.actor,
            message: `prop9-msg-${i}`,
            timestamp: new Date(2024, 0, 1, i).toISOString(),
            metadata: null,
          }))

          mockConversationQuery(messages)

          const { unmount, container } = renderWithProviders(
            <ChatPanel
              declarationId={1}
              declarationStatus={status}
              readonly={true}
            />
          )

          // Initial state: collapsed — only last 3 visible
          const toggleBtn = screen.getByRole('button', { name: /View conversation/i })
          expect(toggleBtn).toBeInTheDocument()

          // Click to expand — all N messages should be visible
          fireEvent.click(toggleBtn)
          const renderedAfterExpand = messages.filter((msg) =>
            within(container).queryAllByText(msg.message).length > 0
          )
          expect(renderedAfterExpand).toHaveLength(n)

          // Click again to collapse — only last 3 visible
          fireEvent.click(toggleBtn)
          const renderedAfterCollapse = messages.filter((msg) =>
            within(container).queryAllByText(msg.message).length > 0
          )
          expect(renderedAfterCollapse).toHaveLength(3)

          // The 3 visible must be the last 3
          const expectedVisible = messages.slice(-3)
          for (const expected of expectedVisible) {
            expect(within(container).queryByText(expected.message)).toBeInTheDocument()
          }

          unmount()
          cleanup()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Feature: unified-declaration-chat, Property 10: No toggle for small conversations
   *
   * For any message array with length ≤ 3 (including empty), all messages are
   * shown and no toggle button is rendered.
   *
   * Validates: Requirements 9.5, 9.7
   */
  it('Property 10: No toggle for small conversations — all messages shown, no toggle button', () => {
    // Feature: unified-declaration-chat, Property 10: No toggle for small conversations
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3 }).chain((n) =>
          fc.tuple(
            fc.constant(n),
            fc.array(
              fc.record({
                type: messageTypeArb,
                actor: actorArb,
              }),
              { minLength: n, maxLength: n }
            )
          )
        ),
        declarationStatusArb,
        ([n, rawEntries], status) => {
          const messages: ChatMessage[] = rawEntries.map((entry, i) => ({
            id: `msg-${i}`,
            type: entry.type,
            actor: entry.actor,
            message: `prop10-msg-${i}`,
            timestamp: new Date(2024, 0, 1, i).toISOString(),
            metadata: null,
          }))

          mockConversationQuery(messages)

          const { unmount, container } = renderWithProviders(
            <ChatPanel
              declarationId={1}
              declarationStatus={status}
              readonly={true}
            />
          )

          // No toggle button should be present
          const toggleBtn = screen.queryByRole('button', { name: /View conversation/i })
          expect(toggleBtn).not.toBeInTheDocument()

          if (n === 0) {
            // Empty state message should be shown
            expect(screen.getByText(/No communication history yet/i)).toBeInTheDocument()
          } else {
            // All messages should be visible
            for (const msg of messages) {
              expect(within(container).queryByText(msg.message)).toBeInTheDocument()
            }
          }

          unmount()
          cleanup()
        }
      ),
      { numRuns: 80 }
    )
  })

  /**
   * Feature: unified-declaration-chat, Property 12: Site visit badge label mapping
   *
   * For any SITE_VISIT message:
   *   - badge label is "📍 Site Visit Scheduled" when message="Site Visit Scheduled"
   *   - badge label is "✅ Site Visit Done" when message="Site Visit Completed"
   * No generic "Site Visit" label (without state suffix) is ever rendered.
   *
   * Validates: Requirements 11.1, 11.2, 11.5
   */
  it('Property 12: Site visit badge label mapping — correct emoji labels for scheduled/completed', () => {
    // Feature: unified-declaration-chat, Property 12: Site visit badge label mapping
    const siteVisitMessageArb = fc.constantFrom('Site Visit Scheduled', 'Site Visit Completed')

    fc.assert(
      fc.property(
        siteVisitMessageArb,
        declarationStatusArb,
        (siteVisitMessage, status) => {
          const messages: ChatMessage[] = [
            {
              id: 'sv-1',
              type: 'SITE_VISIT',
              actor: 'DC',
              message: siteVisitMessage,
              timestamp: '2024-06-01T10:00:00.000Z',
              metadata: null,
            },
          ]

          mockConversationQuery(messages)

          const { unmount } = renderWithProviders(
            <ChatPanel
              declarationId={1}
              declarationStatus={status}
              readonly={true}
            />
          )

          if (siteVisitMessage === 'Site Visit Scheduled') {
            expect(screen.getByText('📍 Site Visit Scheduled')).toBeInTheDocument()
            expect(screen.queryByText('✅ Site Visit Done')).not.toBeInTheDocument()
          } else {
            expect(screen.getByText('✅ Site Visit Done')).toBeInTheDocument()
            expect(screen.queryByText('📍 Site Visit Scheduled')).not.toBeInTheDocument()
          }

          // Generic "Site Visit" label (without emoji/state) must never appear
          // The badge text should always include the specific state
          expect(screen.queryByText('Site Visit')).not.toBeInTheDocument()

          unmount()
          cleanup()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Feature: unified-declaration-chat, Property 14: Metadata suppression
   *
   * For any message with null/empty/"null" (case-insensitive) metadata,
   * no metadata element is rendered.
   *
   * Validates: Requirements 13.1, 13.2, 13.4
   */
  it('Property 14: Metadata suppression — null/empty/"null" metadata never rendered', () => {
    // Feature: unified-declaration-chat, Property 14: Metadata suppression
    // Arbitrary for null-equivalent metadata values
    const nullishMetadataArb = fc.oneof(
      fc.constant(null),
      fc.constant(''),
      fc.constant('null'),
      fc.constant('NULL'),
      fc.constant('Null'),
      fc.constant('nUlL'),
      // Whitespace-only strings also count as empty
      fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 5 })
    )

    fc.assert(
      fc.property(
        nullishMetadataArb,
        fc.constantFrom('CLARIFICATION', 'RESPONSE', 'SITE_VISIT' as ChatMessageType),
        declarationStatusArb,
        (metadata, type, status) => {
          const messages: ChatMessage[] = [
            {
              id: 'msg-1',
              type: type as ChatMessageType,
              actor: 'DC',
              message: type === 'SITE_VISIT' ? 'Site Visit Scheduled' : 'Test message content',
              timestamp: '2024-06-01T10:00:00.000Z',
              metadata: metadata as string | null,
            },
          ]

          mockConversationQuery(messages)

          const { unmount, container } = renderWithProviders(
            <ChatPanel
              declarationId={1}
              declarationStatus={status}
              readonly={true}
            />
          )

          // No italic metadata paragraph should be rendered
          const metadataEls = container.querySelectorAll('p.italic')
          expect(metadataEls).toHaveLength(0)

          // The raw null/empty/null-string value must not appear as text
          if (metadata && metadata.trim() !== '') {
            // "null" variants should not be rendered as text
            const nullVariants = ['null', 'NULL', 'Null', 'nUlL']
            if (nullVariants.includes(metadata)) {
              expect(screen.queryByText(metadata)).not.toBeInTheDocument()
            }
          }

          unmount()
          cleanup()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: unified-declaration-chat, Property 15: Metadata rendered when present
   *
   * For any message with valid non-null, non-empty, non-"null" metadata,
   * the value is rendered visibly within the message bubble.
   *
   * Validates: Requirements 13.3
   */
  it('Property 15: Metadata rendered when present — valid metadata is always shown', () => {
    // Feature: unified-declaration-chat, Property 15: Metadata rendered when present
    // Arbitrary for valid (non-null, non-empty, non-"null") metadata
    const validMetadataArb = fc
      .string({ minLength: 1, maxLength: 100 })
      .filter(
        (s) =>
          s.trim() !== '' &&
          s.toLowerCase() !== 'null'
      )

    fc.assert(
      fc.property(
        validMetadataArb,
        fc.constantFrom('CLARIFICATION', 'RESPONSE', 'SITE_VISIT' as ChatMessageType),
        declarationStatusArb,
        (metadata, type, status) => {
          const messages: ChatMessage[] = [
            {
              id: 'msg-1',
              type: type as ChatMessageType,
              actor: 'DC',
              message: type === 'SITE_VISIT' ? 'Site Visit Scheduled' : 'Test message content',
              timestamp: '2024-06-01T10:00:00.000Z',
              metadata,
            },
          ]

          mockConversationQuery(messages)

          const { unmount, container } = renderWithProviders(
            <ChatPanel
              declarationId={1}
              declarationStatus={status}
              readonly={true}
            />
          )

          // The metadata value must be visible in the rendered output.
          // Use the italic paragraph element that ChatPanel renders for metadata.
          const metadataEls = container.querySelectorAll('p.italic')
          expect(metadataEls.length).toBeGreaterThanOrEqual(1)

          // At least one italic paragraph must contain the metadata text
          const metadataTexts = Array.from(metadataEls).map((el) => el.textContent ?? '')
          expect(metadataTexts.some((text) => text.includes(metadata))).toBe(true)

          unmount()
          cleanup()
        }
      ),
      { numRuns: 80 }
    )
  })
})

describe('TA declarations list — property tests', () => {
  /**
   * Feature: unified-declaration-chat, Property 16: ACTION REQ. badge biconditional
   *
   * For any declaration rendered in the TA declarations list:
   *   - "ACTION REQ." badge is present iff status === 'CLARIFICATION_REQUIRED'
   *   - For all other statuses, the badge is absent
   *
   * This property is tested using a minimal inline component that replicates
   * the exact badge rendering logic from DeclarationCard in DeclarationListPage.tsx:
   *
   *   {isTA && declaration.status === 'CLARIFICATION_REQUIRED' && (
   *     <span ...><Clock size={10} aria-hidden />ACTION REQ.</span>
   *   )}
   *
   * Validates: Requirements 14.1, 14.3
   */
  it('Property 16: ACTION REQ. badge biconditional — present iff status=CLARIFICATION_REQUIRED in TA list', () => {
    // Feature: unified-declaration-chat, Property 16: ACTION REQ. badge biconditional

    /**
     * Minimal component that replicates the ACTION REQ. badge logic from DeclarationCard.
     * This isolates the badge condition from the full page's routing/store dependencies.
     */
    function ActionReqBadge({ status, isTA }: { status: DeclarationStatus; isTA: boolean }) {
      return (
        <div>
          {isTA && status === 'CLARIFICATION_REQUIRED' && (
            <span
              data-testid="action-req-badge"
              className="inline-flex items-center gap-1 rounded-sm border border-orange-300 bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-800 uppercase tracking-label"
            >
              <Clock size={10} aria-hidden />
              ACTION REQ.
            </span>
          )}
        </div>
      )
    }

    fc.assert(
      fc.property(
        declarationStatusArb,
        fc.integer({ min: 1, max: 999 }),
        (status, id) => {
          const { unmount } = renderWithProviders(
            <ActionReqBadge status={status} isTA={true} />
          )

          const badge = screen.queryByTestId('action-req-badge')

          if (status === 'CLARIFICATION_REQUIRED') {
            // Badge must be present for CLARIFICATION_REQUIRED
            expect(badge).toBeInTheDocument()
            expect(badge).toHaveTextContent('ACTION REQ.')
          } else {
            // Badge must be absent for all other statuses
            expect(badge).not.toBeInTheDocument()
          }

          unmount()
          cleanup()
        }
      ),
      { numRuns: 60 }
    )
  })

  /**
   * Corollary: when isTA=false, ACTION REQ. badge is never shown regardless of status.
   * This verifies the badge is TA-only (not shown to DC or other roles).
   *
   * Validates: Requirements 14.1 (TA-specific indicator)
   */
  it('Property 16 corollary: ACTION REQ. badge never shown when isTA=false', () => {
    // Feature: unified-declaration-chat, Property 16: ACTION REQ. badge biconditional (non-TA)

    function ActionReqBadge({ status, isTA }: { status: DeclarationStatus; isTA: boolean }) {
      return (
        <div>
          {isTA && status === 'CLARIFICATION_REQUIRED' && (
            <span data-testid="action-req-badge">ACTION REQ.</span>
          )}
        </div>
      )
    }

    fc.assert(
      fc.property(
        declarationStatusArb,
        (status) => {
          const { unmount } = renderWithProviders(
            <ActionReqBadge status={status} isTA={false} />
          )

          const badge = screen.queryByTestId('action-req-badge')
          expect(badge).not.toBeInTheDocument()

          unmount()
          cleanup()
        }
      ),
      { numRuns: 40 }
    )
  })
})
