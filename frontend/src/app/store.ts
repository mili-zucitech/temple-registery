import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import { rootReducer } from './rootReducer'
import { authApi } from '@/features/auth/authApi'
import { geoApi } from '@/features/geo/geoApi'
import { trustApi } from '@/features/trust/trustApi'
import { employeeApi } from '@/features/employee/employeeApi'
import { contractorApi } from '@/features/contractor/contractorApi'
import { declarationApi } from '@/features/declaration/declarationApi'
import { documentApi } from '@/features/document/documentApi'
import { notificationApi } from '@/features/notification/notificationApi'
import { exportApi } from '@/features/export/exportApi'
import { adminApi } from '@/features/admin/adminApi'
import { dcApi } from '@/features/dc/dcApi'
import { governanceApi } from '@/features/governance/governanceApi'
import { workflowApi } from '@/features/governance/workflowApi'
import { governanceV2Api } from '@/features/governance/governanceV2Api'
import { templeApi } from '@/features/temple-profile/hooks/templeApi'

/** Global RTK Query error logger middleware */
const rtkQueryErrorLogger =
  () =>
  (next: (action: unknown) => unknown) =>
  (action: unknown) => {
    if (
      typeof action === 'object' &&
      action !== null &&
      'type' in action &&
      typeof (action as { type: string }).type === 'string' &&
      (action as { type: string }).type.endsWith('/rejected')
    ) {
      const payload = (action as { payload?: { status?: number; data?: { message?: string } } }).payload
      if (payload?.status && payload.status >= 500) {
        console.error('[API Error]', payload)
      }
    }
    return next(action)
  }

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      rtkQueryErrorLogger,
      authApi.middleware,
      geoApi.middleware,
      templeApi.middleware,
      trustApi.middleware,
      employeeApi.middleware,
      contractorApi.middleware,
      declarationApi.middleware,
      documentApi.middleware,
      notificationApi.middleware,
      exportApi.middleware,
      adminApi.middleware,
      dcApi.middleware,
      governanceApi.middleware,
      workflowApi.middleware,
      governanceV2Api.middleware,
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector<RootState, T>(selector)
