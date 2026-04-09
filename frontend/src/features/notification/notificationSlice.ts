import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface NotificationState {
  unreadCount: number
  dropdownOpen: boolean
}

const initialState: NotificationState = {
  unreadCount: 0,
  dropdownOpen: false,
}

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload
    },
    toggleDropdown(state) {
      state.dropdownOpen = !state.dropdownOpen
    },
  },
})

export const { setUnreadCount, toggleDropdown } = notificationSlice.actions
export default notificationSlice.reducer
