import React, { createContext, useContext, useReducer, useCallback } from 'react'
import type { Step1Data, Step3Data, Step4Data, WizardState } from './registerTypes'

// ── Actions ───────────────────────────────────────────────────────────────────

type WizardAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SAVE_STEP1'; payload: Step1Data }
  | { type: 'SAVE_INIT_TOKEN'; payload: string }
  | { type: 'SAVE_TEMP_TOKEN'; payload: string }
  | { type: 'SAVE_STEP3'; payload: Omit<Step3Data, 'confirmPassword'> }
  | { type: 'SAVE_STEP4'; payload: Step4Data }
  | { type: 'SAVE_USER_ID'; payload: number }
  | { type: 'SAVE_RECOVERY_CODES'; payload: string[] }
  | { type: 'RESET' }

// ── Reducer ───────────────────────────────────────────────────────────────────

const initialState: WizardState = {
  currentStep: 1,
  step1: null,
  step2: null,
  initToken: null,
  tempToken: null,
  step3: null,
  step4: null,
  userId: null,
  recoveryCodes: [],
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
    case 'SAVE_STEP1':
      return { ...state, step1: action.payload }
    case 'SAVE_INIT_TOKEN':
      return { ...state, initToken: action.payload }
    case 'SAVE_TEMP_TOKEN':
      return { ...state, tempToken: action.payload }
    case 'SAVE_STEP3':
      return { ...state, step3: action.payload }
    case 'SAVE_STEP4':
      return { ...state, step4: action.payload }
    case 'SAVE_USER_ID':
      return { ...state, userId: action.payload }
    case 'SAVE_RECOVERY_CODES':
      return { ...state, recoveryCodes: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface WizardContextValue {
  state: WizardState
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  saveStep1: (data: Step1Data) => void
  saveInitToken: (token: string) => void
  saveTempToken: (token: string) => void
  saveStep3: (data: Omit<Step3Data, 'confirmPassword'>) => void
  saveStep4: (data: Step4Data) => void
  saveUserId: (id: number) => void
  saveRecoveryCodes: (codes: string[]) => void
  reset: () => void
}

const WizardContext = createContext<WizardContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function RegisterWizardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState)

  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step })
  }, [])

  const nextStep = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: Math.min(state.currentStep + 1, 8) })
  }, [state.currentStep])

  const prevStep = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: Math.max(state.currentStep - 1, 1) })
  }, [state.currentStep])

  const saveStep1 = useCallback((data: Step1Data) => {
    dispatch({ type: 'SAVE_STEP1', payload: data })
  }, [])

  const saveInitToken = useCallback((token: string) => {
    dispatch({ type: 'SAVE_INIT_TOKEN', payload: token })
  }, [])

  const saveTempToken = useCallback((token: string) => {
    dispatch({ type: 'SAVE_TEMP_TOKEN', payload: token })
  }, [])

  const saveStep3 = useCallback((data: Omit<Step3Data, 'confirmPassword'>) => {
    dispatch({ type: 'SAVE_STEP3', payload: data })
  }, [])

  const saveStep4 = useCallback((data: Step4Data) => {
    dispatch({ type: 'SAVE_STEP4', payload: data })
  }, [])

  const saveUserId = useCallback((id: number) => {
    dispatch({ type: 'SAVE_USER_ID', payload: id })
  }, [])

  const saveRecoveryCodes = useCallback((codes: string[]) => {
    dispatch({ type: 'SAVE_RECOVERY_CODES', payload: codes })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const value: WizardContextValue = {
    state,
    goToStep,
    nextStep,
    prevStep,
    saveStep1,
    saveInitToken,
    saveTempToken,
    saveStep3,
    saveStep4,
    saveUserId,
    saveRecoveryCodes,
    reset,
  }

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
}

// ── Consumer hook ─────────────────────────────────────────────────────────────

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext)
  if (!ctx) {
    throw new Error('useWizard must be used inside <RegisterWizardProvider>')
  }
  return ctx
}
