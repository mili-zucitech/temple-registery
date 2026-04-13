import { useCallback, useEffect, useRef, useState } from 'react'
import { Smartphone, RefreshCw, KeyRound } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWizard } from '../RegisterContext'
import { useMfaSetupFlow } from '../registerHooks'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Step6MfaSetup() {
  const { state, saveRecoveryCodes, nextStep, prevStep } = useWizard()
  const { sendSetupOtp, verifySetupOtp, isSending, isVerifying } = useMfaSetupFlow()

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [otpSent, setOtpSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendCount, setResendCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null))

  const phone = state.step1?.mobile ?? ''
  const userId = state.userId

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  const handleSendOtp = useCallback(async () => {
    if (!userId) return
    const success = await sendSetupOtp(userId, phone)
    if (success) {
      setOtpSent(true)
      setResendCount((c) => c + 1)
      setResendCooldown(RESEND_COOLDOWN)
      setDigits(Array(OTP_LENGTH).fill(''))
      setError(null)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [userId, phone, sendSetupOtp])

  const handleChange = (index: number, value: string) => {
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
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        setDigits((prev) => { const next = [...prev]; next[index] = ''; return next })
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    const next = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
  }

  const otp = digits.join('')
  const isComplete = otp.length === OTP_LENGTH

  const handleVerify = async () => {
    if (!userId || !isComplete) return
    setError(null)
    const codes = await verifySetupOtp(userId, otp)
    if (codes) {
      saveRecoveryCodes(codes)
      nextStep()
    } else {
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
      setError('Invalid OTP. Please try again.')
    }
  }

  const maskedPhone = phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1XXXX$3')
  const canResend = resendCooldown === 0 && resendCount < 3 && !isSending

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold font-display">Set Up Two-Factor Authentication</h2>
        <p className="text-sm text-muted-foreground">
          Secure your account with SMS-based two-factor authentication. An OTP will be
          sent to your registered mobile number each time you log in.
        </p>
      </div>

      {/* Phone display */}
      <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-4 py-3">
        <Smartphone className="h-5 w-5 text-muted-foreground shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">Mobile number</p>
          <p className="text-sm font-medium">{maskedPhone}</p>
        </div>
      </div>

      {!otpSent ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click below to send a verification OTP to your mobile number.
          </p>
          <Button
            type="button"
            className="w-full"
            onClick={handleSendOtp}
            disabled={isSending}
          >
            {isSending ? 'Sending OTP…' : 'Send OTP to Enable MFA'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit OTP sent to <span className="font-medium text-foreground">{maskedPhone}</span>
          </p>

          {/* Segmented OTP */}
          <div
            className="flex items-center gap-2 justify-center"
            role="group"
            aria-label="MFA OTP input"
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
            <p className="text-sm text-destructive text-center" role="alert">{error}</p>
          )}

          {/* Resend */}
          <div className="flex items-center justify-end text-sm">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={!canResend}
              className={cn(
                'flex items-center gap-1 font-medium transition-colors',
                canResend
                  ? 'text-primary hover:text-primary/80 cursor-pointer'
                  : 'text-muted-foreground cursor-not-allowed',
              )}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isSending && 'animate-spin')} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resendCount >= 3 ? 'Limit reached' : 'Resend OTP'}
            </button>
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={handleVerify}
            disabled={!isComplete || isVerifying}
          >
            {isVerifying ? 'Verifying…' : 'Verify & Activate MFA →'}
          </Button>
        </div>
      )}

      <Button type="button" variant="ghost" onClick={prevStep} className="w-full text-muted-foreground">
        ← Back to Review
      </Button>
    </div>
  )
}
