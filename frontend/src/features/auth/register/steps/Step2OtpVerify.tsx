import { useCallback, useEffect, useRef, useState } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { KeyRound, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useWizard } from '../RegisterContext'
import { useAadhaarOtpRequest, useAadhaarOtpVerify } from '../registerHooks'

const OTP_LENGTH = 6
const TIMER_SECONDS = 300
const RESEND_COOLDOWN = 60

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Step2OtpVerify() {
  const { state, saveTempToken, nextStep, prevStep } = useWizard()
  const { sendOtp, isLoading: isSending } = useAadhaarOtpRequest()
  const { verifyOtp, isLoading: isVerifying } = useAadhaarOtpVerify()

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendCount, setResendCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null))

  useEffect(() => {
    if (timeLeft <= 0) return
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [timeLeft])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    setError(null)
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }, [])

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (digits[index]) {
          setDigits((prev) => {
            const next = [...prev]
            next[index] = ''
            return next
          })
        } else if (index > 0) {
          inputRefs.current[index - 1]?.focus()
        }
        e.preventDefault()
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    },
    [digits],
  )

  const handlePaste = useCallback((e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    const next = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i]
    }
    setDigits(next)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
  }, [])

  const otp = digits.join('')
  const isComplete = otp.length === OTP_LENGTH

  const handleVerify = async () => {
    if (!isComplete || !state.step1 || !state.initToken) return
    setError(null)
    const token = await verifyOtp(state.step1.aadhaarNumber, otp, state.initToken)
    if (token) {
      saveTempToken(token)
      nextStep()
    } else {
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
      setError('Invalid OTP. Please check and try again.')
    }
  }

  const handleResend = async () => {
    if (!state.step1 || resendCooldown > 0 || resendCount >= 3) return
    const token = await sendOtp(state.step1.aadhaarNumber, state.step1.mobile)
    if (token) {
      setResendCount((c) => c + 1)
      setResendCooldown(RESEND_COOLDOWN)
      setTimeLeft(TIMER_SECONDS)
      setDigits(Array(OTP_LENGTH).fill(''))
      setError(null)
      inputRefs.current[0]?.focus()
    }
  }

  const isExpired = timeLeft <= 0
  const canResend = resendCooldown === 0 && resendCount < 3 && !isSending

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold font-display">Verify Your Aadhaar</h2>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit OTP sent to the mobile number linked with your Aadhaar.
        </p>
        {state.step1?.mobile && (
          <p className="text-sm font-medium text-foreground">
            Mobile: {state.step1.mobile.replace(/(\d{2})(\d{4})(\d{4})/, '$1XXXX$3')}
          </p>
        )}
      </div>

      <div
        className="flex items-center gap-2 justify-center"
        role="group"
        aria-label="One-time password input"
        onPaste={handlePaste}
      >
        {digits.map((digit, i) => (
          <Input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            aria-label={`OTP digit ${i + 1}`}
            className={cn(
              'h-12 w-12 text-center text-xl font-bold tracking-widest p-0',
              error && 'border-destructive focus-visible:ring-destructive',
            )}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive text-center" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          {isExpired ? (
            <span className="text-destructive font-medium">OTP expired</span>
          ) : (
            <>
              <KeyRound className="h-3.5 w-3.5" />
              <span>Expires in <span className="font-medium text-foreground">{formatTime(timeLeft)}</span></span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend || isSending}
          className={cn(
            'flex items-center gap-1 text-sm font-medium transition-colors',
            canResend && !isSending
              ? 'text-primary hover:text-primary/80 cursor-pointer'
              : 'text-muted-foreground cursor-not-allowed',
          )}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isSending && 'animate-spin')} />
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : resendCount >= 3
              ? 'Limit reached'
              : 'Resend OTP'}
        </button>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={prevStep} className="w-1/3">
          ← Back
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={handleVerify}
          disabled={!isComplete || isVerifying || isExpired}
        >
          {isVerifying ? 'Verifying…' : 'Verify OTP →'}
        </Button>
      </div>
    </div>
  )
}