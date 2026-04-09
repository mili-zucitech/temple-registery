import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CurrentUser } from './authTypes'

interface AuthState {
  currentUser: CurrentUser | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  currentUser: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCurrentUser(state, action: PayloadAction<CurrentUser>) {
      state.currentUser = action.payload
      state.isAuthenticated = true
    },
    clearCurrentUser(state) {
      state.currentUser = null
      state.isAuthenticated = false
    },
  },
})

export const { setCurrentUser, clearCurrentUser } = authSlice.actions
export default authSlice.reducer
