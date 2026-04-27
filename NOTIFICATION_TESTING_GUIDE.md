# Notification Module - Testing Guide

## 🧪 Quick Testing Guide for Phase 3 Frontend

This guide helps you verify that the notification system is working correctly.

---

## ✅ PRE-TESTING CHECKLIST

### Backend Requirements
- [ ] Backend server is running
- [ ] Database migrations applied (V43)
- [ ] SMTP configured (for email testing)
- [ ] At least one test user exists

### Frontend Requirements
- [ ] Frontend dev server is running
- [ ] User is logged in
- [ ] API connection is working

---

## 🔔 TEST 1: Notification Bell Component

### Location
Top-right corner of every page (TopBar)

### What to Test
1. **Bell Icon Visibility**
   - [ ] Bell icon is visible in TopBar
   - [ ] Icon has proper styling and hover effect

2. **Unread Badge**
   - [ ] Badge shows correct unread count
   - [ ] Badge displays "9+" for counts > 9
   - [ ] Badge has red background
   - [ ] Badge animates on appearance

3. **Dropdown Behavior**
   - [ ] Click bell → Dropdown opens
   - [ ] Click outside → Dropdown closes
   - [ ] Press Escape → Dropdown closes
   - [ ] Dropdown positioned correctly (right-aligned)

4. **Polling**
   - [ ] Wait 30 seconds → New notifications appear
   - [ ] Badge updates automatically
   - [ ] No console errors during polling

### Expected Result
```
✅ Bell icon visible with unread count badge
✅ Dropdown opens/closes correctly
✅ Automatic updates every 30 seconds
```

---

## 📋 TEST 2: Notification Dropdown

### Location
Popover that appears when clicking bell icon

### What to Test
1. **Header Section**
   - [ ] "Notifications" title displayed
   - [ ] "Mark all read" button visible (if unread exist)
   - [ ] Button disabled state works during loading

2. **Notifications List**
   - [ ] Shows 5 most recent notifications
   - [ ] Notifications display correctly:
     - [ ] Title
     - [ ] Body text
     - [ ] Timestamp (relative, e.g., "2 hours ago")
     - [ ] Priority badge (colored)
     - [ ] Unread indicator (dot)
   - [ ] Scrollable if more than 5 notifications

3. **Loading State**
   - [ ] Spinner shows while loading
   - [ ] No flickering during load

4. **Empty State**
   - [ ] "No notifications yet" message when empty
   - [ ] Centered and styled correctly

5. **Footer**
   - [ ] "View all notifications" button visible
   - [ ] Clicking navigates to `/notifications`
   - [ ] Dropdown closes after navigation

6. **Mark All Read**
   - [ ] Click "Mark all read"
   - [ ] Loading spinner appears
   - [ ] All notifications marked as read
   - [ ] Unread dots disappear
   - [ ] Badge count updates to 0

### Expected Result
```
✅ Dropdown shows recent notifications
✅ Mark all read works correctly
✅ Navigation to full inbox works
✅ Loading and empty states display properly
```

---

## 📬 TEST 3: Notification Inbox Page

### Location
`/notifications` route

### What to Test
1. **Page Layout**
   - [ ] Page title "Notifications" in TopBar
   - [ ] Search bar visible at top
   - [ ] Priority filter dropdown visible
   - [ ] Tab navigation (All, Unread, Read) visible
   - [ ] Pagination controls at bottom

2. **Search Functionality**
   - [ ] Type in search box
   - [ ] Results filter in real-time
   - [ ] Searches both title and body
   - [ ] Clear search works
   - [ ] No results message when no matches

3. **Priority Filter**
   - [ ] Dropdown shows: All, Critical, High, Medium, Low
   - [ ] Selecting filter updates results
   - [ ] Badge colors match priority:
     - Critical: Red
     - High: Orange
     - Medium: Blue
     - Low: Gray

4. **Tab Filters**
   - [ ] "All" tab shows all notifications
   - [ ] "Unread" tab shows only unread
   - [ ] "Read" tab shows only read
   - [ ] Active tab highlighted
   - [ ] Count updates correctly

5. **Notification Cards**
   - [ ] Cards display in grid layout
   - [ ] Each card shows:
     - [ ] Category icon
     - [ ] Priority badge
     - [ ] Title (bold)
     - [ ] Body text
     - [ ] Timestamp
     - [ ] Action button (if actionUrl exists)
     - [ ] Unread indicator
   - [ ] Hover effect on cards
   - [ ] Click card → Marks as read
   - [ ] Click action button → Navigates to URL

6. **Pagination**
   - [ ] Page size selector (10, 25, 50, 100)
   - [ ] Previous/Next buttons work
   - [ ] Page numbers displayed
   - [ ] Current page highlighted
   - [ ] Total count displayed

7. **Mark All Read Button**
   - [ ] Button visible at top
   - [ ] Click → All notifications marked read
   - [ ] Loading state during operation
   - [ ] Success feedback

8. **Empty States**
   - [ ] "No notifications" when none exist
   - [ ] "No unread notifications" on Unread tab
   - [ ] "No read notifications" on Read tab
   - [ ] "No results found" for search with no matches

9. **Responsive Design**
   - [ ] Mobile: Single column layout
   - [ ] Tablet: Two column layout
   - [ ] Desktop: Three column layout
   - [ ] All controls accessible on mobile

### Expected Result
```
✅ Full inbox page displays correctly
✅ Search, filters, and tabs work
✅ Pagination functions properly
✅ Cards are interactive and responsive
✅ Empty states display appropriately
```

---

## ⚙️ TEST 4: Notification Preferences Page

### Location
`/notifications/preferences` route

### What to Test
1. **Page Layout**
   - [ ] Page title "Notification Preferences" in TopBar
   - [ ] Description text at top
   - [ ] Module cards in grid layout
   - [ ] Save button at bottom

2. **Module Cards**
   - [ ] All 7 modules displayed:
     - [ ] Temple Profile
     - [ ] Trust & Board
     - [ ] Employees
     - [ ] Contractors
     - [ ] Asset Declarations
     - [ ] Documents
     - [ ] System Notifications
   - [ ] Each card has:
     - [ ] Module icon
     - [ ] Module name
     - [ ] "In-App" toggle switch
     - [ ] "Email" toggle switch

3. **Toggle Switches**
   - [ ] Switches reflect current preferences
   - [ ] Click toggle → State changes
   - [ ] Visual feedback on toggle
   - [ ] Both toggles work independently

4. **Save Functionality**
   - [ ] Click "Save Preferences"
   - [ ] Loading spinner appears
   - [ ] Success toast notification
   - [ ] Preferences persisted to backend
   - [ ] Reload page → Preferences retained

5. **Loading State**
   - [ ] Initial load shows spinner
   - [ ] Cards appear after load
   - [ ] No flickering

6. **Error Handling**
   - [ ] Network error → Error toast
   - [ ] Retry mechanism works
   - [ ] User can still interact with page

7. **Responsive Design**
   - [ ] Mobile: Single column
   - [ ] Tablet: Two columns
   - [ ] Desktop: Three columns

### Expected Result
```
✅ Preferences page loads correctly
✅ All modules displayed with toggles
✅ Save functionality works
✅ Preferences persist across sessions
✅ Error handling works properly
```

---

## 🔄 TEST 5: Real-Time Updates

### What to Test
1. **Polling Mechanism**
   - [ ] Open notification bell
   - [ ] Trigger new notification from backend
   - [ ] Wait up to 30 seconds
   - [ ] New notification appears
   - [ ] Badge count updates

2. **Multiple Tabs**
   - [ ] Open app in two browser tabs
   - [ ] Mark notification as read in tab 1
   - [ ] Wait 30 seconds
   - [ ] Tab 2 updates to reflect change

3. **Background Polling**
   - [ ] Leave page open for 5 minutes
   - [ ] Verify polling continues
   - [ ] No memory leaks
   - [ ] No console errors

### Expected Result
```
✅ New notifications appear within 30 seconds
✅ Updates sync across tabs
✅ Polling runs continuously without issues
```

---

## 🎨 TEST 6: Visual Design & Accessibility

### What to Test
1. **Visual Consistency**
   - [ ] Colors match design system
   - [ ] Fonts consistent with app
   - [ ] Spacing and padding uniform
   - [ ] Icons properly sized
   - [ ] Shadows and borders consistent

2. **Priority Colors**
   - [ ] Critical: Red (#ef4444)
   - [ ] High: Orange (#f97316)
   - [ ] Medium: Blue (#3b82f6)
   - [ ] Low: Gray (#6b7280)

3. **Animations**
   - [ ] Badge appears with zoom animation
   - [ ] Cards have hover effects
   - [ ] Transitions are smooth
   - [ ] No janky animations

4. **Keyboard Navigation**
   - [ ] Tab through all interactive elements
   - [ ] Enter to activate buttons
   - [ ] Escape to close dropdown
   - [ ] Focus indicators visible

5. **Screen Reader**
   - [ ] Bell button has ARIA label
   - [ ] Notification count announced
   - [ ] Cards have proper structure
   - [ ] Form labels present

6. **Color Contrast**
   - [ ] Text readable on backgrounds
   - [ ] Badges have sufficient contrast
   - [ ] Links distinguishable

### Expected Result
```
✅ Visual design matches system
✅ Animations smooth and professional
✅ Keyboard navigation works
✅ Screen reader compatible
✅ Color contrast meets WCAG AA
```

---

## 🔗 TEST 7: Integration & Navigation

### What to Test
1. **Deep Linking**
   - [ ] Click notification with actionUrl
   - [ ] Navigates to correct page
   - [ ] Notification marked as read
   - [ ] Dropdown closes

2. **Route Navigation**
   - [ ] `/notifications` route works
   - [ ] `/notifications/preferences` route works
   - [ ] Back button works correctly
   - [ ] Browser history maintained

3. **Cross-Module Integration**
   - [ ] Notification from Declaration module
   - [ ] Click action → Navigate to declaration detail
   - [ ] Context preserved
   - [ ] No errors in console

4. **Authentication**
   - [ ] Logged out user → Redirected to login
   - [ ] Logged in user → Can access notifications
   - [ ] User sees only their notifications
   - [ ] No unauthorized access

### Expected Result
```
✅ Deep linking works correctly
✅ All routes accessible
✅ Navigation smooth and error-free
✅ Authentication enforced
```

---

## 🐛 TEST 8: Error Handling

### What to Test
1. **Network Errors**
   - [ ] Disconnect network
   - [ ] Try to load notifications
   - [ ] Error message displayed
   - [ ] Retry mechanism available
   - [ ] Reconnect → Data loads

2. **API Errors**
   - [ ] Backend returns 500 error
   - [ ] User-friendly error message
   - [ ] No app crash
   - [ ] Can recover from error

3. **Empty Responses**
   - [ ] No notifications exist
   - [ ] Empty state displayed
   - [ ] No console errors
   - [ ] UI remains functional

4. **Invalid Data**
   - [ ] Malformed notification data
   - [ ] App handles gracefully
   - [ ] Logs error to console
   - [ ] Shows fallback UI

### Expected Result
```
✅ Network errors handled gracefully
✅ API errors don't crash app
✅ Empty states display correctly
✅ Invalid data handled safely
```

---

## 📱 TEST 9: Responsive Design

### What to Test
1. **Mobile (< 640px)**
   - [ ] Bell icon visible and tappable
   - [ ] Dropdown fits screen
   - [ ] Inbox page single column
   - [ ] Cards stack vertically
   - [ ] Filters accessible
   - [ ] Pagination works

2. **Tablet (640px - 1024px)**
   - [ ] Two column layout
   - [ ] Dropdown properly sized
   - [ ] All controls accessible
   - [ ] Touch targets adequate

3. **Desktop (> 1024px)**
   - [ ] Three column layout
   - [ ] Full feature set visible
   - [ ] Optimal spacing
   - [ ] No horizontal scroll

4. **Orientation Changes**
   - [ ] Portrait → Landscape works
   - [ ] Layout adjusts correctly
   - [ ] No content cut off

### Expected Result
```
✅ Mobile layout works perfectly
✅ Tablet layout optimized
✅ Desktop layout spacious
✅ Orientation changes handled
```

---

## 🎯 TEST 10: Performance

### What to Test
1. **Load Times**
   - [ ] Initial page load < 2 seconds
   - [ ] Notification fetch < 500ms
   - [ ] Dropdown opens instantly
   - [ ] No lag when scrolling

2. **Large Data Sets**
   - [ ] 100+ notifications load correctly
   - [ ] Pagination handles large sets
   - [ ] Search remains fast
   - [ ] No memory issues

3. **Polling Impact**
   - [ ] CPU usage reasonable
   - [ ] Network requests minimal
   - [ ] Battery drain acceptable (mobile)
   - [ ] No performance degradation over time

4. **Caching**
   - [ ] RTK Query caches data
   - [ ] Subsequent loads faster
   - [ ] Cache invalidation works
   - [ ] No stale data issues

### Expected Result
```
✅ Fast load times
✅ Handles large data sets
✅ Polling efficient
✅ Caching works correctly
```

---

## 📊 TEST RESULTS TEMPLATE

### Test Session Information
- **Date**: _______________
- **Tester**: _______________
- **Environment**: Dev / Staging / Production
- **Browser**: _______________
- **Device**: _______________

### Test Results Summary

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Notification Bell | ⬜ Pass ⬜ Fail | |
| 2 | Notification Dropdown | ⬜ Pass ⬜ Fail | |
| 3 | Notification Inbox | ⬜ Pass ⬜ Fail | |
| 4 | Preferences Page | ⬜ Pass ⬜ Fail | |
| 5 | Real-Time Updates | ⬜ Pass ⬜ Fail | |
| 6 | Visual & Accessibility | ⬜ Pass ⬜ Fail | |
| 7 | Integration & Navigation | ⬜ Pass ⬜ Fail | |
| 8 | Error Handling | ⬜ Pass ⬜ Fail | |
| 9 | Responsive Design | ⬜ Pass ⬜ Fail | |
| 10 | Performance | ⬜ Pass ⬜ Fail | |

### Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Overall Assessment
⬜ Ready for Production  
⬜ Minor Issues (can deploy)  
⬜ Major Issues (needs fixes)  

---

## 🚀 QUICK TEST SCRIPT

### Automated Test Flow (5 minutes)
```bash
# 1. Start backend and frontend
# 2. Login as Temple Authority user
# 3. Navigate to /ta/declarations
# 4. Submit a declaration
# 5. Logout and login as DC user
# 6. Check notification bell (should have badge)
# 7. Click bell (should see "Declaration Submitted")
# 8. Click notification (should navigate to declaration)
# 9. Navigate to /notifications
# 10. Verify notification appears in inbox
# 11. Navigate to /notifications/preferences
# 12. Toggle some preferences
# 13. Click Save
# 14. Verify success toast
# 15. Reload page
# 16. Verify preferences persisted
```

### Expected Time: 5-10 minutes for full test

---

## 🔍 DEBUGGING TIPS

### Common Issues

#### Bell Not Showing Badge
- Check: API endpoint `/api/notifications` returning data
- Check: Network tab for 200 response
- Check: Redux DevTools for notification state
- Check: Console for errors

#### Dropdown Not Opening
- Check: Popover component imported correctly
- Check: Click handler attached
- Check: Z-index conflicts
- Check: Console for React errors

#### Notifications Not Loading
- Check: Backend server running
- Check: CORS configuration
- Check: Authentication token valid
- Check: Database has notification records

#### Polling Not Working
- Check: useEffect cleanup function
- Check: Interval set correctly (30000ms)
- Check: Component mounted
- Check: No errors in console

#### Preferences Not Saving
- Check: PUT endpoint `/api/notification-preferences`
- Check: Request body format correct
- Check: Backend validation passing
- Check: Database update successful

---

## ✅ SIGN-OFF CHECKLIST

Before marking Phase 3 as complete:

- [ ] All 10 tests passed
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Accessibility verified
- [ ] Responsive design works
- [ ] Error handling robust
- [ ] Documentation reviewed
- [ ] Code reviewed
- [ ] Ready for production

**Signed Off By**: _______________  
**Date**: _______________  
**Status**: ⬜ Approved ⬜ Needs Work

---

**END OF TESTING GUIDE**
