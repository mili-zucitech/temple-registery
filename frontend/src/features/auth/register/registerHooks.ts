import { useCallback } from 'react'
import { toast } from 'sonner'
import {
  useRegisterCreateMutation,
} from '@/features/auth/authApi'
import type {
  Step1Data,
  Step3Data,
  Step4Data,
  CreateAccountRequest,
} from './registerTypes'

// ── useSubmitRegistration ─────────────────────────────────────────────────────
// Step 4: POSTs the full registration payload, returns userId

interface UseSubmitRegistrationResult {
  submitRegistration: (
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
      step1: Step1Data,
      step3: Omit<Step3Data, 'confirmPassword'>,
      step4: Step4Data,
    ): Promise<number | null> => {
      const payload: CreateAccountRequest = {
        aadhaar: step1.aadhaarNumber,
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
