import { useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { mfaVerifySchema, type MfaVerifyRequest } from '../../authTypes'
import { useMfaVerify } from '../../authHooks'

export function MfaPrompt() {
  const location = useLocation()
  const tempToken: string = (location.state as { tempToken: string })?.tempToken ?? ''
  const mfaType: string = (location.state as { mfaType: string })?.mfaType ?? 'TOTP'
  const { handleVerify, isLoading } = useMfaVerify()

  const form = useForm<MfaVerifyRequest>({
    resolver: zodResolver(mfaVerifySchema),
    defaultValues: { tempToken, mfaCode: '' },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => handleVerify(values, form.setError))} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {mfaType === 'TOTP'
            ? 'Enter the 6-digit code from your authenticator app.'
            : 'Enter the 6-digit OTP sent to your registered mobile number.'}
        </p>

        {import.meta.env.DEV && mfaType === 'SMS_OTP' && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span className="font-semibold">Dev mode:</span> OTP is printed in the backend console logs.
          </div>
        )}

        <FormField
          control={form.control}
          name="mfaCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OTP Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  name={field.name}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Verifying…' : 'Verify'}
        </Button>
      </form>
    </Form>
  )
}
