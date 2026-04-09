import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CurrentUser } from './authTypes'

interface AuthState {
  currentUser: CurrentUser | null
  isAuthenticated: boolean
  accessToken: string | null
}

const initialState: AuthState = {
  currentUser: null,
  isAuthenticated: false,
  accessToken: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCurrentUser(state, action: PayloadAction<CurrentUser>) {
      state.currentUser = action.payload
      state.isAuthenticated = true
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
    },
    clearCurrentUser(state) {
      state.currentUser = null
      state.isAuthenticated = false
      state.accessToken = null
    },
  },
})

export const { setCurrentUser, setAccessToken, clearCurrentUser } = authSlice.actions
export default authSlice.reducer
