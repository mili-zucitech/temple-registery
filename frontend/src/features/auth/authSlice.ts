import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CurrentUser } from './authTypes'

interface AuthState {
  currentUser: CurrentUser | null
  isAuthenticated: boolean
  // NOTE: accessToken is intentionally NOT stored here.
  // JWT is stored exclusively in an httpOnly cookie set by the server.
  // No token is ever placed in Redux state — this field is kept only as a
  // type stub to avoid breaking imports; it is always null and unused.
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
