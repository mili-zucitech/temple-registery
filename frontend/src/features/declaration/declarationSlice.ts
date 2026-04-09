import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface DeclarationState {
  clarificationThreadOpen: boolean
  reviewPanelExpanded: boolean
}

const initialState: DeclarationState = {
  clarificationThreadOpen: false,
  reviewPanelExpanded: false,
}

const declarationSlice = createSlice({
  name: 'declaration',
  initialState,
  reducers: {
    toggleClarificationThread(state) {
      state.clarificationThreadOpen = !state.clarificationThreadOpen
    },
    setReviewPanelExpanded(state, action: PayloadAction<boolean>) {
      state.reviewPanelExpanded = action.payload
    },
  },
})

export const { toggleClarificationThread, setReviewPanelExpanded } = declarationSlice.actions
export default declarationSlice.reducer
