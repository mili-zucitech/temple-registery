import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAppDispatch } from '@/app/store'
import { setCurrentUser, clearCurrentUser } from './authSlice'
import {
  useLoginMutation,
  useMfaVerifyMutation,
  useLogoutMutation,
  useAadhaarOtpRequestMutation,
  useAadhaarOtpVerifyMutation,
  useRegisterMutation,
  usePasswordResetRequestMutation,
  usePasswordResetConfirmMutation,
  useGetCurrentUserQuery,
  authApi,
} from './authApi'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { USER_ROLES } from '@/constants/roles'
import type { UseFormSetError } from 'react-hook-form'
import type { UseFormSetError } from 'react-hook-form'
import type { LoginRequest, MfaVerifyRequest, MfaChallengeResponse, AuthTokenResponse } from './authTypes'

export function useCurrentUser() {
  const { data, isLoading, isError } = useGetCurrentUserQuery()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (data?.data) {
      dispatch(setCurrentUser(data.data))
    }
  }, [data, dispatch])

  return { user: data?.data ?? null, isLoading, isError }
}

export function useLogin() {
  const [login, { isLoading }] = useLoginMutation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogin = async (values: LoginRequest) => {
    const result = await login(values)
    if ('data' in result && result.data.success) {
      const payload = result.data.data
      if ('tempToken' in payload) {
        // MFA required — navigate to MFA page carrying temp token
        const challenge = payload as MfaChallengeResponse
        navigate(ROUTE_PATHS.MFA_VERIFY, {
          state: { tempToken: challenge.tempToken, mfaType: challenge.challengeType },
        })
      } else {
        // Direct auth — tokens are set as httpOnly cookies by the server.
        // Immediately hydrate Redux so PrivateRoute / RoleRoute don't redirect to login
        // before the /auth/me refetch completes.
        const meta = payload as AuthTokenResponse
        dispatch(setCurrentUser({
          userId: meta.userId,
          username: values.username,
          fullName: values.username,    // placeholder — /auth/me will overwrite
          role: meta.role as import('@/constants/roles').UserRole,
          aadhaarVerified: false,
        }))
        // Invalidate stale getCurrentUser cache so PrivateRoute re-fetches cleanly
        dispatch(authApi.util.invalidateTags(['CurrentUser']))
        toast.success('Login successful')
        navigate(getDashboardPath(meta.role))
      }
    } else if ('error' in result) {
      toast.error('Login failed. Please check your credentials.')
    }
  }

  return { handleLogin, isLoading }
}

export function useMfaVerify() {
  const [verify, { isLoading }] = useMfaVerifyMutation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleVerify = async (
    values: MfaVerifyRequest,
    setError?: UseFormSetError<MfaVerifyRequest>,
  ) => {
    const result = await verify(values)
    if ('data' in result && result.data.success) {
      const meta = result.data.data as { role?: string; userId?: number }
      if (meta.role && meta.userId) {
        dispatch(setCurrentUser({
          userId: meta.userId,
          username: '',
          fullName: '',
          role: meta.role as import('@/constants/roles').UserRole,
          aadhaarVerified: false,
        }))
        dispatch(authApi.util.invalidateTags(['CurrentUser']))
      }
      toast.success('Verification successful')
      navigate(getDashboardPath(meta.role))
    } else {
      const message = 'Invalid or expired OTP. Please try again.'
      if (setError) {
        setError('mfaCode', { message })
      } else {
        toast.error(message)
      }
    }
  }

  return { handleVerify, isLoading }
}

import { templeApi } from '@/features/temple/templeApi'
import { resetFilters } from '@/features/temple/templeSlice'

export function useLogout() {
  const [logout] = useLogoutMutation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    dispatch(clearCurrentUser())
    dispatch(authApi.util.resetApiState())
    dispatch(templeApi.util.resetApiState())
    dispatch(resetFilters())
    navigate(ROUTE_PATHS.LOGIN)
  }

  return { handleLogout }
}

export function useRegister() {
  const [register, { isLoading }] = useRegisterMutation()
  const navigate = useNavigate()

  const handleRegister = async (values: Parameters<typeof register>[0]) => {
    const result = await register(values)
    if ('data' in result && result.data.success) {
      toast.success('Registration submitted. Your account is pending activation by the Super Admin.')
      navigate(ROUTE_PATHS.LOGIN)
    } else {
      toast.error('Registration failed. Please try again.')
    }
  }

  return { handleRegister, isLoading }
}

export function getDashboardPath(role?: string): string {
  if (!role) return ROUTE_PATHS.LOGIN
  if (role === USER_ROLES.SUPER_ADMIN) return ROUTE_PATHS.ADMIN_DASHBOARD
  if (role === USER_ROLES.DISTRICT_COLLECTOR || role === USER_ROLES.DC_STAFF) return ROUTE_PATHS.DC_DASHBOARD
  if (role === USER_ROLES.TEMPLE_AUTHORITY) return ROUTE_PATHS.TA_DASHBOARD
  if (role === USER_ROLES.AUDITOR) return ROUTE_PATHS.AUDITOR_DASHBOARD
  return ROUTE_PATHS.LOGIN
}

export function useDashboardRedirect(role?: string) {
  return getDashboardPath(role)
}
