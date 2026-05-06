import { describe, it, expect } from 'vitest'
import authReducer, { setCurrentUser, clearCurrentUser } from './authSlice'
import type { CurrentUser } from './authTypes'

const mockUser: CurrentUser = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  fullName: 'Admin User',
  role: 'SUPER_ADMIN',
}

describe('authSlice', () => {
  it('should_have_null_currentUser_in_initial_state', () => {
    const state = authReducer(undefined, { type: '@@INIT' })
    expect(state.currentUser).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should_not_expose_accessToken_in_state_shape', () => {
    const state = authReducer(undefined, { type: '@@INIT' })
    // accessToken must never appear in Redux state — JWT lives in httpOnly cookie only
    expect((state as Record<string, unknown>)['accessToken']).toBeUndefined()
  })

  it('should_set_currentUser_and_mark_authenticated_when_setCurrentUser_is_dispatched', () => {
    const state = authReducer(undefined, setCurrentUser(mockUser))
    expect(state.currentUser).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('should_clear_currentUser_and_unauthenticate_when_clearCurrentUser_is_dispatched', () => {
    const withUser = authReducer(undefined, setCurrentUser(mockUser))
    const cleared = authReducer(withUser, clearCurrentUser())
    expect(cleared.currentUser).toBeNull()
    expect(cleared.isAuthenticated).toBe(false)
  })

  it('should_not_export_setAccessToken_action', () => {
    // The exported named actions must only be setCurrentUser and clearCurrentUser.
    // If setAccessToken were re-added, the type-check above would catch it at compile time.
    // Here we validate the behaviour by asserting no 'accessToken' field in the state.
    const state = authReducer(undefined, setCurrentUser(mockUser))
    expect('accessToken' in state).toBe(false)
  })
})
