import { createSlice } from '@reduxjs/toolkit'

interface NotificationState {
  dropdownOpen: boolean
}

const initialState: NotificationState = {
  dropdownOpen: false,
}

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    toggleDropdown(state) {
      state.dropdownOpen = !state.dropdownOpen
    },
  },
})

export const { toggleDropdown } = notificationSlice.actions
export default notificationSlice.reducer
