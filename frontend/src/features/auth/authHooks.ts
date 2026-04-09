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
import type { LoginRequest, MfaVerifyRequest, MfaChallengeResponse } from './authTypes'

export function useCurrentUser() {
  const { data, isLoading, isError } = useGetCurrentUserQuery()
  const dispatch = useAppDispatch()

  if (data?.data) {
    dispatch(setCurrentUser(data.data))
  }

  return { user: data?.data ?? null, isLoading, isError }
}

export function useLogin() {
  const [login, { isLoading }] = useLoginMutation()
  const [verify] = useMfaVerifyMutation()
  const navigate = useNavigate()

  const handleLogin = async (values: LoginRequest) => {
    const result = await login(values)
    if ('data' in result && result.data.success) {
      const payload = result.data.data
      if ('tempToken' in payload) {
        const { tempToken, mfaRequired } = payload as MfaChallengeResponse
        if (!mfaRequired) {
          // MFA disabled — auto-verify with no OTP code
          const verifyResult = await verify({ tempToken, mfaCode: null })
          if ('data' in verifyResult && verifyResult.data.success) {
            toast.success('Login successful')
            navigate(ROUTE_PATHS.DC_DASHBOARD)
          } else {
            toast.error('Login failed. Please try again.')
          }
        } else {
          // MFA required — navigate to MFA page carrying temp token
          navigate(ROUTE_PATHS.MFA_VERIFY, { state: { tempToken, mfaType: (payload as MfaChallengeResponse).mfaType } })
        }
      } else {
        toast.success('Login successful')
        navigate(ROUTE_PATHS.DC_DASHBOARD)
      }
    } else if ('error' in result) {
      toast.error('Login failed. Please check your credentials.')
    }
  }

  return { handleLogin, isLoading }
}

export function useMfaVerify() {
  const [verify, { isLoading }] = useMfaVerifyMutation()
  const navigate = useNavigate()

  const handleVerify = async (values: MfaVerifyRequest) => {
    const result = await verify(values)
    if ('data' in result && result.data.success) {
      toast.success('Verification successful')
      navigate(ROUTE_PATHS.DC_DASHBOARD)
    } else {
      toast.error('Invalid or expired OTP. Please try again.')
    }
  }

  return { handleVerify, isLoading }
}

export function useLogout() {
  const [logout] = useLogoutMutation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    dispatch(clearCurrentUser())
    dispatch(authApi.util.resetApiState())
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

export function useDashboardRedirect(role?: string) {
  if (!role) return ROUTE_PATHS.LOGIN
  if (role === USER_ROLES.SUPER_ADMIN) return ROUTE_PATHS.ADMIN_DASHBOARD
  if (role === USER_ROLES.DISTRICT_COLLECTOR || role === USER_ROLES.DC_STAFF) return ROUTE_PATHS.DC_DASHBOARD
  if (role === USER_ROLES.TEMPLE_AUTHORITY) return ROUTE_PATHS.TA_DASHBOARD
  if (role === USER_ROLES.AUDITOR) return ROUTE_PATHS.AUDITOR_DASHBOARD
  return ROUTE_PATHS.LOGIN
}
