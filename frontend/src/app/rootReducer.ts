import { combineReducers } from '@reduxjs/toolkit'
import { authApi } from '@/features/auth/authApi'
import { geoApi } from '@/features/geo/geoApi'
import { templeApi } from '@/features/temple/templeApi'
import { trustApi } from '@/features/trust/trustApi'
import { employeeApi } from '@/features/employee/employeeApi'
import { contractorApi } from '@/features/contractor/contractorApi'
import { declarationApi } from '@/features/declaration/declarationApi'
import { documentApi } from '@/features/document/documentApi'
import { notificationApi } from '@/features/notification/notificationApi'
import { exportApi } from '@/features/export/exportApi'
import { adminApi } from '@/features/admin/adminApi'
import authReducer from '@/features/auth/authSlice'
import templeReducer from '@/features/temple/templeSlice'
import declarationReducer from '@/features/declaration/declarationSlice'
import notificationReducer from '@/features/notification/notificationSlice'

export const rootReducer = combineReducers({
  // RTK Query caches
  [authApi.reducerPath]: authApi.reducer,
  [geoApi.reducerPath]: geoApi.reducer,
  [templeApi.reducerPath]: templeApi.reducer,
  [trustApi.reducerPath]: trustApi.reducer,
  [employeeApi.reducerPath]: employeeApi.reducer,
  [contractorApi.reducerPath]: contractorApi.reducer,
  [declarationApi.reducerPath]: declarationApi.reducer,
  [documentApi.reducerPath]: documentApi.reducer,
  [notificationApi.reducerPath]: notificationApi.reducer,
  [exportApi.reducerPath]: exportApi.reducer,
  [adminApi.reducerPath]: adminApi.reducer,

  // UI slices
  auth: authReducer,
  temple: templeReducer,
  declaration: declarationReducer,
  notification: notificationReducer,
})
