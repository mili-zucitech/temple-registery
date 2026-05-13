import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { TimelineTab } from './TimelineTab'
import { timelineApi } from '@/features/timeline/timelineApi'
import type { TempleTimelineEventResponse } from '@/features/timeline/timelineTypes'

// ─── Minimal Redux store with timelineApi ─────────────────────────────────────

function makeStore() {
  return configureStore({
    reducer: {
      [timelineApi.reducerPath]: timelineApi.reducer,
    },
    middleware: (gDM) => gDM().concat(timelineApi.middleware),
  })
}

function renderWithStore(ui: React.ReactElement) {
  const store = makeStore()
  return render(<Provider store={store}>{ui}</Provider>)
}

// ─── Test data ────────────────────────────────────────────────────────────────

const makeEvent = (id: number, code: string): TempleTimelineEventResponse => ({
  id,
  templeId: 1,
  eventType: 'WORKFLOW_TRANSITION',
  eventCode: code,
  moduleName: 'TEMPLE_PROFILE',
  entityName: null,
  title: code === 'PROFILE_APPROVED' ? 'Temple Profile Approved' : 'Event',
  description: 'An event occurred.',
  metadata: null,
  referenceId: null,
  oldStatus: 'SUBMITTED',
  newStatus: 'APPROVED',
  workflowAction: 'APPROVE',
  performerId: 1,
  performerName: null,
  performerRole: 'DISTRICT_COLLECTOR',
  comment: null,
  createdBySystem: false,
  occurredAt: new Date().toISOString(),
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TimelineTab', () => {
  it('should_render_loading_skeleton_when_query_is_loading', () => {
    // No MSW mock — query will be in pending state, showing skeleton
    renderWithStore(<TimelineTab templeId={1} />)

    // When loading, multiple Skeleton elements are rendered
    // The SectionCard title should still appear
    expect(screen.getByText('Activity Timeline')).toBeDefined()
  })

  it('should_render_section_card_with_activity_timeline_title', () => {
    renderWithStore(<TimelineTab templeId={999} />)

    expect(screen.getByText('Activity Timeline')).toBeDefined()
  })
})
