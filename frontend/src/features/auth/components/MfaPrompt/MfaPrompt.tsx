import { useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { mfaVerifySchema, type MfaVerifyRequest } from '../authTypes'
import { useMfaVerify } from '../authHooks'

export function MfaPrompt() {
  const location = useLocation()
  const tempToken: string = (location.state as { tempToken: string })?.tempToken ?? ''
  const mfaType: string = (location.state as { mfaType: string })?.mfaType ?? 'TOTP'
  const { handleVerify, isLoading } = useMfaVerify()

  const form = useForm<MfaVerifyRequest>({
    resolver: zodResolver(mfaVerifySchema),
    defaultValues: { tempToken, code: '' },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleVerify)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {mfaType === 'TOTP'
            ? 'Enter the 6-digit code from your authenticator app.'
            : 'Enter the 6-digit OTP sent to your registered mobile number.'}
        </p>

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OTP Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  {...field}
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
