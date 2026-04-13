import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { UseFormReturn } from 'react-hook-form'
import type { TaProfileStagingRequest } from '@/features/temple/templeTypes'

interface ProfileFormProps {
  form: UseFormReturn<TaProfileStagingRequest>
  disabled: boolean
  /** onOverviewClick: navigate to Overview tab to see read-only registration data */
  onOverviewClick?: () => void
}

export function ProfileForm({ form, disabled, onOverviewClick }: ProfileFormProps) {
  return (
    <Form {...form}>
      <div className={cn('space-y-6', disabled && 'pointer-events-none opacity-60')}>

        {/* Registration data note */}
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-start gap-2.5">
          <span className="text-lg mt-0.5" role="img" aria-label="lock">🔒</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Registration information is read-only</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Temple name, deity, address, grade and GPS were captured at registration.{' '}
              {onOverviewClick && (
                <button onClick={onOverviewClick} className="text-primary hover:underline font-medium">
                  View in Overview tab →
                </button>
              )}
            </p>
          </div>
        </div>

        {/* Contact Person */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Point of Contact
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contactPersonName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Contact Person Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Shri Ramesh Kumar"
                      disabled={disabled}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPersonDesignation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Designation <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Executive Officer"
                      disabled={disabled}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="10-digit mobile"
                      maxLength={10}
                      disabled={disabled}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contact@temple.org"
                      disabled={disabled}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://temple.org"
                      disabled={disabled}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        {/* Worship Details */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Worship & Operations
          </legend>

          <FormField
            control={form.control}
            name="languagesOfWorship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Languages of Worship</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Kannada, Sanskrit, Telugu (comma-separated)"
                    disabled={disabled}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormDescription>Separate multiple languages with a comma.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="linkedInstitutions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Linked Institution / Mutt</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Sringeri Sharada Peetham"
                    disabled={disabled}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temple Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief description of the temple, its history, and significance…"
                    rows={4}
                    disabled={disabled}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="annualFestivals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Festivals &amp; Events</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="List major festivals, dates, and special events…"
                    rows={3}
                    disabled={disabled}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>
      </div>
    </Form>
  )
}


