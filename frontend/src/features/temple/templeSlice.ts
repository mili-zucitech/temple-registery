import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { TempleSearchFilterRequest } from './templeTypes'

interface TempleState {
  activeFilters: TempleSearchFilterRequest
  currentPage: number
  pageSize: number
}

const initialState: TempleState = {
  activeFilters: {},
  currentPage: 0,
  pageSize: 10,
}

const templeSlice = createSlice({
  name: 'temple',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<TempleSearchFilterRequest>) {
      state.activeFilters = action.payload
      state.currentPage = 0
    },
    setPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload
    },
    resetFilters(state) {
      state.activeFilters = {}
      state.currentPage = 0
    },
  },
})

export const { setFilters, setPage, resetFilters } = templeSlice.actions
export default templeSlice.reducer
