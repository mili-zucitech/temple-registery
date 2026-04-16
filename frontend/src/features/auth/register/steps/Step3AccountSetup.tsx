import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, User } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWizard } from '../RegisterContext'
import { step3Schema, type Step3Data } from '../registerTypes'

type StrengthLevel = 0 | 1 | 2 | 3 | 4

function computeStrength(password: string): StrengthLevel {
  if (!password) return 0
  let score = 0
  if (password.length >= 10) score++
  if (password.length >= 14) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*()\-_=+\[\]{}]/.test(password)) score++
  return Math.min(4, score) as StrengthLevel
}

const STRENGTH_LABELS: Record<StrengthLevel, string> = {
  0: '',
  1: 'Weak',
  2: 'Fair',
  3: 'Strong',
  4: 'Very Strong',
}

const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  0: '',
  1: 'bg-destructive',
  2: 'bg-warning',
  3: 'bg-success/80',
  4: 'bg-success',
}

export function Step3AccountSetup() {
  const { state, saveStep3, nextStep, prevStep } = useWizard()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      fullName: state.step3?.fullName ?? '',
      username: state.step3?.username ?? '',
      email: state.step3?.email ?? '',
      password: state.step3?.password ?? '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  })

  const password = form.watch('password') ?? ''
  const strength = useMemo(() => computeStrength(password), [password])

  const onSubmit = (values: Step3Data) => {
    const { confirmPassword: _confirmPassword, ...rest } = values
    saveStep3(rest)
    nextStep()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold font-display">Account Setup</h2>
        <p className="text-sm text-muted-foreground">
          Create your login credentials. Choose a strong password for your government portal account.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Legal Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="As per Aadhaar card"
                    autoFocus
                    autoComplete="name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      className="pl-9"
                      placeholder="e.g. ta_chamundi"
                      autoComplete="username"
                    />
                  </div>
                </FormControl>
                <p className="text-[11px] text-muted-foreground">
                  4–64 characters. Letters, numbers, dots, underscores, hyphens only.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 10 characters"
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>

                {password && (
                  <div className="space-y-1 pt-1">
                    <div className="flex gap-1">
                      {([1, 2, 3, 4] as StrengthLevel[]).map((level) => (
                        <div
                          key={level}
                          className={cn(
                            'h-1 flex-1 rounded-full transition-all duration-300',
                            strength >= level ? STRENGTH_COLORS[strength] : 'bg-muted',
                          )}
                        />
                      ))}
                    </div>
                    {strength > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        Strength:{' '}
                        <span
                          className={cn(
                            'font-medium',
                            strength <= 1 && 'text-destructive',
                            strength === 2 && 'text-warning-foreground',
                            strength >= 3 && 'text-success',
                          )}
                        >
                          {STRENGTH_LABELS[strength]}
                        </span>
                      </p>
                    )}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={prevStep} className="w-1/3">
              ← Back
            </Button>
            <Button type="submit" className="flex-1">
              Continue →
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}