import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck, Smartphone } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useWizard } from '../RegisterContext'
import { step1Schema, type Step1Data } from '../registerTypes'

export function Step1MobileAadhaar() {
  const { state, saveStep1, nextStep } = useWizard()

  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      mobile: state.step1?.mobile ?? '',
      aadhaarNumber: state.step1?.aadhaarNumber ?? '',
    },
  })

  const onSubmit = async (values: Step1Data) => {
    saveStep1(values)
    nextStep()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold font-display">Identity Information</h2>
        <p className="text-sm text-muted-foreground">
          Enter your mobile number and Aadhaar number to begin registration.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" />
                  Mobile Number
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                    autoComplete="tel-national"
                    autoFocus
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="aadhaarNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Aadhaar Number
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="XXXX XXXX XXXX"
                    autoComplete="off"
                    // Format display with spaces every 4 chars but store raw digits
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 12)
                      field.onChange(raw)
                    }}
                    value={
                      field.value
                        ? field.value.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3').trim()
                        : ''
                    }
                  />
                </FormControl>
                <p className="text-[11px] text-muted-foreground">
                  Your Aadhaar number is encrypted and never stored in plain text.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Continue →
          </Button>
        </form>
      </Form>
    </div>
  )
}
