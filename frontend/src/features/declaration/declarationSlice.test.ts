import { describe, it, expect } from 'vitest'
import declarationReducer, {
  toggleClarificationThread,
  setReviewPanelExpanded,
} from './declarationSlice'

describe('declarationSlice', () => {
  const initialState = {
    clarificationThreadOpen: false,
    reviewPanelExpanded: false,
  }

  it('should_returnInitialState_when_undefinedState', () => {
    expect(declarationReducer(undefined, { type: '@@init' })).toEqual(initialState)
  })

  describe('toggleClarificationThread', () => {
    it('should_setTrueFromFalse', () => {
      const state = declarationReducer(initialState, toggleClarificationThread())
      expect(state.clarificationThreadOpen).toBe(true)
    })

    it('should_setFalseFromTrue', () => {
      const openState = { ...initialState, clarificationThreadOpen: true }
      const state = declarationReducer(openState, toggleClarificationThread())
      expect(state.clarificationThreadOpen).toBe(false)
    })

    it('should_notAffectOtherFields', () => {
      const state = declarationReducer(initialState, toggleClarificationThread())
      expect(state.reviewPanelExpanded).toBe(false)
    })
  })

  describe('setReviewPanelExpanded', () => {
    it('should_setExpandedTrue', () => {
      const state = declarationReducer(initialState, setReviewPanelExpanded(true))
      expect(state.reviewPanelExpanded).toBe(true)
    })

    it('should_setExpandedFalse', () => {
      const expandedState = { ...initialState, reviewPanelExpanded: true }
      const state = declarationReducer(expandedState, setReviewPanelExpanded(false))
      expect(state.reviewPanelExpanded).toBe(false)
    })

    it('should_notAffectClarificationThread', () => {
      const state = declarationReducer(initialState, setReviewPanelExpanded(true))
      expect(state.clarificationThreadOpen).toBe(false)
    })
  })
})
