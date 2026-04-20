import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  useRegisterInitMutation,
  useVerifyAadhaarMutation,
  useRegisterCreateMutation,
  useMfaSetupMutation,
  useMfaSetupVerifyMutation,
} from '@/features/auth/authApi'
import type {
  Step1Data,
  Step3Data,
  Step4Data,
  CreateAccountRequest,
} from './registerTypes'

// ── useAadhaarOtpRequest ──────────────────────────────────────────────────────
// Step 1 → 2: sends Aadhaar OTP via POST /auth/register/init
// Returns the init session token (tempToken) on success, null on failure.

interface UseAadhaarOtpRequestResult {
  sendOtp: (aadhaarNumber: string, mobile: string) => Promise<string | null>
  isLoading: boolean
}

export function useAadhaarOtpRequest(): UseAadhaarOtpRequestResult {
  const [registerInit, { isLoading }] = useRegisterInitMutation()

  const sendOtp = useCallback(
    async (aadhaarNumber: string, mobile: string): Promise<string | null> => {
      try {
        // Backend field is `aadhaar` (not `aadhaarNumber`); mobile is also required
        const res = await registerInit({ aadhaar: aadhaarNumber, mobile }).unwrap()
        if (!res.success) {
          toast.error(res.message || 'Failed to send OTP. Please try again.')
          return null
        }

        const devOtp = res.data?.devOtp
        if (devOtp) {
          toast.info(`[Dev] OTP: ${devOtp}`, { duration: 10000 })
        } else {
          toast.success('OTP sent to the mobile number linked to your Aadhaar.')
        }
        return res.data.tempToken
      } catch (err: any) {
        const errorMsg = err?.data?.message || err?.message || 'Failed to send OTP. Please try again.'
        toast.error(errorMsg)
        return null
      }
    },
    [registerInit],
  )

  return { sendOtp, isLoading }
}

// ── useAadhaarOtpVerify ───────────────────────────────────────────────────────
// Step 2: verifies OTP; requires the initToken from step 1 response.
// Returns the AADHAAR_VERIFIED tempToken on success, null on failure.

interface UseAadhaarOtpVerifyResult {
  verifyOtp: (aadhaarNumber: string, otp: string, initToken: string) => Promise<string | null>
  isLoading: boolean
}

export function useAadhaarOtpVerify(): UseAadhaarOtpVerifyResult {
  const [verifyAadhaar, { isLoading }] = useVerifyAadhaarMutation()

  const verifyOtp = useCallback(
    async (aadhaarNumber: string, otp: string, initToken: string): Promise<string | null> => {
      try {
        // Backend field is `aadhaar`; also requires the initToken as `tempToken`
        const res = await verifyAadhaar({ aadhaar: aadhaarNumber, otp, tempToken: initToken }).unwrap()
        if (!res.success) {
          toast.error(res.message || 'Invalid or expired OTP. Please try again.')
          return null
        }

        toast.success('Aadhaar verified successfully.')
        // Backend returns `verificationToken` (not `tempToken`) from /register/verify-aadhaar
        return res.data.verificationToken
      } catch (err: any) {
        const errorMsg = err?.data?.message || err?.message || 'Invalid or expired OTP. Please try again.'
        toast.error(errorMsg)
        return null
      }
    },
    [verifyAadhaar],
  )

  return { verifyOtp, isLoading }
}

// ── useSubmitRegistration ─────────────────────────────────────────────────────
// Step 5: POSTs the full registration payload, returns userId

interface UseSubmitRegistrationResult {
  submitRegistration: (
    tempToken: string,
    step1: Step1Data,
    step3: Omit<Step3Data, 'confirmPassword'>,
    step4: Step4Data,
  ) => Promise<number | null>
  isLoading: boolean
}

export function useSubmitRegistration(): UseSubmitRegistrationResult {
  const [registerCreate, { isLoading }] = useRegisterCreateMutation()

  const submitRegistration = useCallback(
    async (
      tempToken: string,
      step1: Step1Data,
      step3: Omit<Step3Data, 'confirmPassword'>,
      step4: Step4Data,
    ): Promise<number | null> => {
      const payload: CreateAccountRequest = {
        tempToken,
        username: step3.username,
        email: step3.email,
        password: step3.password,
        fullName: step3.fullName,
        mobile: step1.mobile,
        temple: {
          name: step4.templeName,
          aliasName: step4.aliasName ?? undefined,
          deityName: step4.deityName,
          grade: step4.grade,
          religiousTradition: step4.religiousTradition,
          hobliId: step4.hobliId,
          addressLine1: step4.addressLine1,
          pincode: step4.pincode,
          gpsLatitude: step4.gpsLatitude ?? undefined,
          gpsLongitude: step4.gpsLongitude ?? undefined,
        },
      }

      try {
        const res = await registerCreate(payload).unwrap()
        if (!res.success) {
          toast.error(res.message || 'Registration failed. Please check your details and try again.')
          return null
        }
        return res.data.userId
      } catch (err: any) {
        const errorMsg = err?.data?.message || err?.message || 'Registration failed. Please check your details and try again.'
        toast.error(errorMsg)
        return null
      }
    },
    [registerCreate],
  )

  return { submitRegistration, isLoading }
}

// ── useMfaSetupFlow ───────────────────────────────────────────────────────────
// Steps 6–7: sends SMS OTP and verifies it; returns recovery codes

interface UseMfaSetupFlowResult {
  sendSetupOtp: (userId: number, phone: string) => Promise<boolean>
  verifySetupOtp: (userId: number, otp: string) => Promise<string[] | null>
  isSending: boolean
  isVerifying: boolean
  resendCount: number
  resetResend: () => void
}

export function useMfaSetupFlow(): UseMfaSetupFlowResult {
  const [mfaSetup, { isLoading: isSending }] = useMfaSetupMutation()
  const [mfaSetupVerify, { isLoading: isVerifying }] = useMfaSetupVerifyMutation()
  const resendCountRef = useRef(0)

  const sendSetupOtp = useCallback(
    async (userId: number, phone: string): Promise<boolean> => {
      if (resendCountRef.current >= 3) {
        toast.error('Maximum resend attempts reached. Please restart the registration.')
        return false
      }
      try {
        const res = await mfaSetup({ userId, phone }).unwrap()
        if (!res.success) {
          toast.error(res.message || 'Failed to send OTP. Please try again.')
          return false
        }
        resendCountRef.current += 1
        toast.success('OTP sent to your mobile number.')
        return true
      } catch (err: any) {
        const errorMsg = err?.data?.message || err?.message || 'Failed to send OTP. Please try again.'
        toast.error(errorMsg)
        return false
      }
    },
    [mfaSetup],
  )

  const verifySetupOtp = useCallback(
    async (userId: number, otp: string): Promise<string[] | null> => {
      try {
        const res = await mfaSetupVerify({ userId, otp }).unwrap()
        if (!res.success) {
          toast.error(res.message || 'Invalid OTP. Please try again.')
          return null
        }
        return res.data.recoveryCodes
      } catch (err: any) {
        const errorMsg = err?.data?.message || err?.message || 'Invalid OTP. Please try again.'
        toast.error(errorMsg)
        return null
      }
    },
    [mfaSetupVerify],
  )

  const resetResend = useCallback(() => {
    resendCountRef.current = 0
  }, [])

  return {
    sendSetupOtp,
    verifySetupOtp,
    isSending,
    isVerifying,
    resendCount: resendCountRef.current,
    resetResend,
  }
}
