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

interface UseAadhaarOtpRequestResult {
  sendOtp: (aadhaarNumber: string, mobile: string) => Promise<string | null>
  isLoading: boolean
}

export function useAadhaarOtpRequest(): UseAadhaarOtpRequestResult {
  const [registerInit, { isLoading }] = useRegisterInitMutation()

  const sendOtp = useCallback(
    async (aadhaarNumber: string, mobile: string): Promise<string | null> => {
      const result = await registerInit({ aadhaar: aadhaarNumber, mobile })
      if ('data' in result && result.data.success) {
        const responseData = result.data.data
        const devOtp = responseData?.devOtp
        if (devOtp) {
          toast.info(`[Dev] OTP: ${devOtp}`, { duration: 10000 })
        } else {
          toast.success('OTP sent to the mobile number linked to your Aadhaar.')
        }
        return responseData?.tempToken ?? null
      }
      const errorMsg =
        ('error' in result && (result.error as { data?: { message?: string } })?.data?.message) ||
        'Failed to send OTP. Please try again.'
      toast.error(errorMsg)
      return null
    },
    [registerInit],
  )

  return { sendOtp, isLoading }
}

interface UseAadhaarOtpVerifyResult {
  verifyOtp: (aadhaarNumber: string, otp: string, initToken: string) => Promise<string | null>
  isLoading: boolean
}

export function useAadhaarOtpVerify(): UseAadhaarOtpVerifyResult {
  const [verifyAadhaar, { isLoading }] = useVerifyAadhaarMutation()

  const verifyOtp = useCallback(
    async (aadhaarNumber: string, otp: string, initToken: string): Promise<string | null> => {
      const result = await verifyAadhaar({ aadhaar: aadhaarNumber, otp, tempToken: initToken })
      if ('data' in result && result.data.success) {
        toast.success('Aadhaar verified successfully.')
        return result.data.data?.verificationToken ?? null
      }
      const errorMsg =
        ('error' in result && (result.error as { data?: { message?: string } })?.data?.message) ||
        'Invalid or expired OTP. Please try again.'
      toast.error(errorMsg)
      return null
    },
    [verifyAadhaar],
  )

  return { verifyOtp, isLoading }
}

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

      const result = await registerCreate(payload)
      if ('data' in result && result.data.success) {
        return result.data.data?.userId ?? null
      }

      const errorMsg =
        ('error' in result && (result.error as { data?: { message?: string } })?.data?.message) ||
        'Registration failed. Please check your details and try again.'
      toast.error(errorMsg)
      return null
    },
    [registerCreate],
  )

  return { submitRegistration, isLoading }
}

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
      const result = await mfaSetup({ userId, phone })
      if ('data' in result && result.data.success) {
        resendCountRef.current += 1
        toast.success('OTP sent to your mobile number.')
        return true
      }
      const errorMsg =
        ('error' in result && (result.error as { data?: { message?: string } })?.data?.message) ||
        'Failed to send OTP. Please try again.'
      toast.error(errorMsg)
      return false
    },
    [mfaSetup],
  )

  const verifySetupOtp = useCallback(
    async (userId: number, otp: string): Promise<string[] | null> => {
      const result = await mfaSetupVerify({ userId, otp })
      if ('data' in result && result.data.success) {
        return result.data.data?.recoveryCodes ?? null
      }
      const errorMsg =
        ('error' in result && (result.error as { data?: { message?: string } })?.data?.message) ||
        'Invalid OTP. Please try again.'
      toast.error(errorMsg)
      return null
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